/**
 * eval-harness.js — Run 20 test queries through the RAG pipeline and log results.
 *
 * Run:  node eval/eval-harness.js
 *
 * Outputs a JSON file (eval/results.json) with:
 *   - Retrieved chunks per query (with similarity scores)
 *   - LLM response
 *   - Latency in ms
 *   - Estimated token cost per query
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { writeFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(__dirname, '..', 'server', 'index.js'));
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

// --- Pricing (per 1K tokens, GPT-4 + ada-002) ---
const PRICING = {
  'text-embedding-ada-002': 0.0001,  // $0.0001 per 1K tokens
  'gpt-4-input': 0.03,               // $0.03 per 1K input tokens
  'gpt-4-output': 0.06,              // $0.06 per 1K output tokens
};

// --- 20 Test Questions ---
const testQuestions = [
  // === 10 CLEAR ANSWER questions (answer is directly in corpus) ===
  { id: 1, query: "Who directed Inception and what year was it released?", category: "clear", expectedAnswer: "Christopher Nolan, 2010" },
  { id: 2, query: "How many Academy Awards did The Lord of the Rings: The Return of the King win?", category: "clear", expectedAnswer: "11 Academy Awards" },
  { id: 3, query: "What was the budget of Get Out and how much did it gross?", category: "clear", expectedAnswer: "$4.5M budget, $255M gross" },
  { id: 4, query: "Who played the Joker in The Dark Knight and what award did he win?", category: "clear", expectedAnswer: "Heath Ledger, posthumous Academy Award" },
  { id: 5, query: "What is the runtime of Schindler's List?", category: "clear", expectedAnswer: "195 minutes" },
  { id: 6, query: "What was the first entirely computer-animated feature film?", category: "clear", expectedAnswer: "Toy Story (1995)" },
  { id: 7, query: "Which film won Best Picture at the Oscars but was initially announced incorrectly?", category: "clear", expectedAnswer: "Moonlight (La La Land was announced first)" },
  { id: 8, query: "What visual effect did The Matrix pioneer?", category: "clear", expectedAnswer: "Bullet time" },
  { id: 9, query: "How many Jews did Oskar Schindler save according to the film?", category: "clear", expectedAnswer: "Over 1,100" },
  { id: 10, query: "What is the tagline of Alien?", category: "clear", expectedAnswer: "In space, no one can hear you scream" },

  // === 5 AMBIGUOUS questions (multiple valid answers) ===
  { id: 11, query: "Which Christopher Nolan film is the best?", category: "ambiguous", expectedAnswer: "Multiple valid: Dark Knight, Inception, Interstellar, Prestige, Dunkirk" },
  { id: 12, query: "What's a good movie about dreams or alternate realities?", category: "ambiguous", expectedAnswer: "Could be Inception, Matrix, Eternal Sunshine, Everything Everywhere" },
  { id: 13, query: "Which movie starring Leonardo DiCaprio should I watch?", category: "ambiguous", expectedAnswer: "Could be Inception, Django, Departed, Revenant" },
  { id: 14, query: "What animated movie would you recommend for a family?", category: "ambiguous", expectedAnswer: "Could be WALL-E, Up, Coco, Lion King, Toy Story, Spirited Away" },
  { id: 15, query: "Which film has the best twist ending?", category: "ambiguous", expectedAnswer: "Could be Fight Club, Usual Suspects, Prestige, Sixth Sense" },

  // === 5 OFF-TOPIC questions (should refuse or admit uncertainty) ===
  { id: 16, query: "What is the capital of France?", category: "off-topic", expectedAnswer: "Should refuse — not in movie context" },
  { id: 17, query: "Can you help me write a Python script to scrape websites?", category: "off-topic", expectedAnswer: "Should refuse — not a movie question" },
  { id: 18, query: "What is the plot of the TV show Breaking Bad?", category: "off-topic", expectedAnswer: "Should refuse — TV show not in corpus" },
  { id: 19, query: "Who won the 2024 Super Bowl?", category: "off-topic", expectedAnswer: "Should refuse — sports, not movies" },
  { id: 20, query: "Tell me about the movie Avatar 3", category: "off-topic", expectedAnswer: "Should refuse — not in corpus" },
];

// System prompt (same as server/index.js)
const SYSTEM_PROMPT = 'You are an enthusiastic movie expert who loves recommending movies to people. You will be given two pieces of information - some context about movies and a question. Your main job is to formulate a short answer to the question using the provided context. If you are unsure and cannot find the answer in the context, say, "Sorry, I don\'t know the answer." Please do not make up the answer.';

async function runQuery(query) {
  const startTime = Date.now();

  // 1. Embed the query
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  });
  const embedding = embeddingResponse.data[0].embedding;
  const embeddingTokens = embeddingResponse.usage.total_tokens;

  // 2. Retrieve from Supabase
  const { data: chunks, error } = await supabase.rpc('match_movies', {
    query_embedding: embedding,
    match_threshold: 0.50,
    match_count: 4,
  });

  if (error) throw new Error(`Supabase error: ${error.message}`);

  const context = chunks.map((c) => c.content).join('\n');

  // 3. LLM completion
  const chatResponse = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Context: ${context}\n\nQuestion: ${query}` },
    ],
    temperature: 0.65,
    frequency_penalty: 0.5,
  });

  const endTime = Date.now();

  const reply = chatResponse.choices[0].message.content;
  const inputTokens = chatResponse.usage.prompt_tokens;
  const outputTokens = chatResponse.usage.completion_tokens;

  // Cost calculation
  const embeddingCost = (embeddingTokens / 1000) * PRICING['text-embedding-ada-002'];
  const inputCost = (inputTokens / 1000) * PRICING['gpt-4-input'];
  const outputCost = (outputTokens / 1000) * PRICING['gpt-4-output'];
  const totalCost = embeddingCost + inputCost + outputCost;

  return {
    latencyMs: endTime - startTime,
    retrievedChunks: chunks.map((c) => ({
      id: c.id,
      similarity: c.similarity,
      contentPreview: c.content.slice(0, 120) + '...',
    })),
    numChunksReturned: chunks.length,
    response: reply,
    tokens: { embedding: embeddingTokens, input: inputTokens, output: outputTokens },
    cost: totalCost,
  };
}

async function main() {
  console.log('Running 20 eval queries...\n');
  const results = [];

  for (const q of testQuestions) {
    process.stdout.write(`[${q.id}/20] "${q.query.slice(0, 50)}..." `);
    try {
      const result = await runQuery(q.query);
      results.push({
        ...q,
        ...result,
        grade: null, // To be filled in manually
      });
      console.log(`${result.latencyMs}ms | ${result.numChunksReturned} chunks | $${result.cost.toFixed(5)}`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      results.push({ ...q, error: err.message, grade: null });
    }

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  // --- Summary ---
  const successful = results.filter((r) => !r.error);
  const avgLatency = successful.reduce((sum, r) => sum + r.latencyMs, 0) / successful.length;
  const totalCost = successful.reduce((sum, r) => sum + r.cost, 0);
  const costPer1000 = (totalCost / successful.length) * 1000;

  console.log('\n=== SUMMARY ===');
  console.log(`Queries run:        ${results.length}`);
  console.log(`Successful:         ${successful.length}`);
  console.log(`Avg latency:        ${Math.round(avgLatency)}ms`);
  console.log(`Total cost:         $${totalCost.toFixed(4)}`);
  console.log(`Cost per 1000 q:    $${costPer1000.toFixed(2)}`);
  console.log(`Avg chunks/query:   ${(successful.reduce((s, r) => s + r.numChunksReturned, 0) / successful.length).toFixed(1)}`);

  // Write full results to file
  const outputPath = path.resolve(__dirname, 'results.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nFull results saved to: ${outputPath}`);

  // Print grading template
  console.log('\n=== GRADING TEMPLATE ===');
  console.log('Open eval/results.json, fill in "grade" for each (0=wrong, 1=partial, 2=correct).\n');
  for (const r of results) {
    if (r.error) {
      console.log(`Q${r.id} [${r.category}] — ERROR`);
    } else {
      console.log(`Q${r.id} [${r.category}] "${r.query}"`);
      console.log(`   Expected: ${r.expectedAnswer}`);
      console.log(`   Got:      ${r.response.slice(0, 150)}`);
      console.log(`   Grade: ___`);
    }
    console.log();
  }
}

main();
