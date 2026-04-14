import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// --- Validate required environment variables ---
const required = ['OPENAI_API_KEY', 'SUPABASE_API_KEY', 'SUPABASE_URL'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// --- Initialize clients ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

// --- Express app ---
const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting behind reverse proxies (Railway, Render, etc.)
app.set('trust proxy', 1);

// --- Security middleware ---
app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:5180'];

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
}));

app.use(express.json({ limit: '1mb' }));

// Rate limiting: 30 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// --- Input validation helper ---
function validateQuery(req, res) {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "query" field.' });
    return null;
  }
  const trimmed = query.trim();
  if (trimmed.length === 0 || trimmed.length > 1000) {
    res.status(400).json({ error: 'Query must be between 1 and 1000 characters.' });
    return null;
  }
  return trimmed;
}

// --- Health check ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- POST /api/chat — Main RAG endpoint ---
app.post('/api/chat', async (req, res) => {
  const query = validateQuery(req, res);
  if (!query) return;

  try {
    // 1. Create embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // 2. Find nearest match in Supabase
    const { data, error: matchError } = await supabase.rpc('match_movies', {
      query_embedding: embedding,
      match_threshold: 0.50,
      match_count: 4,
    });

    if (matchError) {
      console.error('Supabase match error:', matchError.message);
      return res.status(502).json({ error: 'Failed to search knowledge base.' });
    }

    const context = data.map((obj) => obj.content).join('\n');

    // 3. Chat completion
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an enthusiastic movie expert who loves recommending movies to people. You will be given two pieces of information - some context about movies and a question. Your main job is to formulate a short answer to the question using the provided context. If you are unsure and cannot find the answer in the context, say, "Sorry, I don\'t know the answer." Please do not make up the answer.',
        },
        {
          role: 'user',
          content: `Context: ${context}\n\nQuestion: ${query}`,
        },
      ],
      temperature: 0.65,
      frequency_penalty: 0.5,
    });

    const reply = chatResponse.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('Chat endpoint error:', error.message);

    if (error.status === 429) {
      return res.status(429).json({ error: 'AI service rate limit reached. Please try again shortly.' });
    }

    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// --- Serve static frontend in production ---
const distPath = path.resolve(__dirname, '..', 'dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// --- Global error handler ---
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
