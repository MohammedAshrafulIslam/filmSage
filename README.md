# ReelRecs

A movie recommendation chatbot powered by RAG (Retrieval-Augmented Generation). You ask it about movies, it searches a vector database of movie descriptions and gives you a conversational answer grounded in real data — not hallucinated nonsense.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991?logo=openai&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-pgvector-3FCF8E?logo=supabase&logoColor=white)

## How it works

```
User question
    ↓
OpenAI text-embedding-ada-002 turns it into a vector
    ↓
Supabase pgvector finds the 4 closest movie descriptions
    ↓
GPT-4 writes a conversational answer using those matches as context
    ↓
User gets a grounded recommendation
```

The key idea: GPT-4 never makes stuff up about movies because it only answers based on what the vector search returns. If it can't find a match, it says so.

## Project structure

```
├── index.html          # Frontend — simple form + response area
├── index.js            # Frontend JS — sends queries to the backend
├── index.css           # Styling
├── vite.config.js      # Vite config with dev proxy to backend
├── server/
│   └── index.js        # Express API — handles OpenAI + Supabase calls
├── .env.example        # Required environment variables
├── Dockerfile          # Multi-stage production build
└── .gitignore
```

The frontend is intentionally minimal. The interesting part is the RAG pipeline on the server.

## Why a backend?

The original version called OpenAI directly from the browser with `dangerouslyAllowBrowser: true`. That's fine for learning, but it means anyone who opens DevTools can grab your API key. The Express server keeps all secrets server-side and adds rate limiting, input validation, and security headers (helmet).

## Running it locally

You'll need your own OpenAI API key and a Supabase project with movie embeddings loaded (see [Setup the vector database](#setup-the-vector-database) below).

```bash
git clone https://github.com/YOUR_USERNAME/reelrecs.git
cd reelrecs

# Install dependencies
npm install
cd server && npm install && cd ..

# Set up environment variables
cp .env.example .env
# Fill in your keys in .env

# Run both frontend and backend
npm run dev
```

The client runs on `http://localhost:5173` and proxies API calls to the server on port 3001.

## Setup the vector database

ReelRecs expects a Supabase project with:

1. The `pgvector` extension enabled
2. A table storing movie descriptions with their embedding vectors
3. A Postgres function called `match_movies` that takes a query embedding and returns the closest matches

If you're following along from the [Scrimba AI Engineer Path](https://scrimba.com/the-ai-engineer-path-c02v), this is all set up in the course. Otherwise, here's the gist:

```sql
-- Enable the extension
create extension if not exists vector;

-- Create the table
create table movies (
  id bigserial primary key,
  content text,
  embedding vector(1536)
);

-- Create the match function
create or replace function match_movies(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (id bigint, content text, similarity float)
language sql stable
as $$
  select id, content, 1 - (embedding <=> query_embedding) as similarity
  from movies
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key for embeddings + chat |
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_API_KEY` | Yes | Supabase anon/service key |
| `PORT` | No | Server port (default: 3001) |
| `CORS_ORIGIN` | No | Allowed origins, comma-separated (default: localhost) |

## Why it's not deployed

API costs. Every query hits both the embeddings endpoint and GPT-4, and I'd rather not wake up to a surprise bill. If you want to try it, clone it and use your own keys — the free tier is enough to play around with.

## What I learned building this

- How RAG actually works end-to-end — embeddings, vector similarity, and grounded generation
- Why you never put API keys in frontend code (even if the SDK lets you)
- pgvector and how Supabase makes vector search surprisingly easy
- The difference between "GPT knows about movies" and "GPT answers based on your data" — RAG makes the answers way more reliable

## License

MIT
