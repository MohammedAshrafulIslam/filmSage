/**
 * corpus-stats.js — Query Supabase to get real corpus metrics.
 *
 * Run:  node eval/corpus-stats.js
 *
 * Outputs: total documents, total characters, avg chunk size (chars & tokens),
 *          min/max chunk size, and a sample of 5 documents so you can write
 *          good eval questions.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve deps from server/node_modules
const require = createRequire(path.resolve(__dirname, '..', 'server', 'index.js'));
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

// Rough token estimate: ~4 chars per token for English text (OpenAI rule of thumb)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

async function main() {
  // Fetch all rows (content only — skip embeddings to save bandwidth)
  const { data, error, count } = await supabase
    .from('movies')
    .select('id, content', { count: 'exact' });

  if (error) {
    console.error('Supabase error:', error.message);
    process.exit(1);
  }

  const totalDocs = data.length;
  const charLengths = data.map((d) => (d.content || '').length);
  const tokenLengths = data.map((d) => estimateTokens(d.content || ''));
  const totalChars = charLengths.reduce((a, b) => a + b, 0);
  const totalTokens = tokenLengths.reduce((a, b) => a + b, 0);

  console.log('=== CORPUS STATS ===');
  console.log(`Total documents/chunks: ${totalDocs}`);
  console.log(`Total characters:       ${totalChars.toLocaleString()}`);
  console.log(`Total tokens (est):     ${totalTokens.toLocaleString()}`);
  console.log(`Avg chunk size:         ${Math.round(totalChars / totalDocs)} chars / ${Math.round(totalTokens / totalDocs)} tokens`);
  console.log(`Min chunk size:         ${Math.min(...charLengths)} chars`);
  console.log(`Max chunk size:         ${Math.max(...charLengths)} chars`);
  console.log(`Median chunk size:      ${charLengths.sort((a, b) => a - b)[Math.floor(totalDocs / 2)]} chars`);

  console.log('\n=== SAMPLE DOCUMENTS (first 5) ===');
  for (const doc of data.slice(0, 5)) {
    console.log(`\n--- ID ${doc.id} (${(doc.content || '').length} chars) ---`);
    console.log((doc.content || '').slice(0, 300) + '...');
  }

  console.log('\n=== ALL DOCUMENT TITLES/FIRST LINES ===');
  for (const doc of data) {
    const firstLine = (doc.content || '').split('\n')[0].slice(0, 120);
    console.log(`  [${doc.id}] ${firstLine}`);
  }
}

main();
