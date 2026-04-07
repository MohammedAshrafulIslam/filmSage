const form = document.querySelector('form');
const input = document.querySelector('input');
const reply = document.querySelector('.reply');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;
  input.value = '';
  main(query);
});

async function main(query) {
  try {
    reply.innerHTML = 'Thinking...';

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (response.status === 429) {
      reply.innerHTML = 'Too many requests. Please wait a moment and try again.';
      return;
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error (${response.status})`);
    }

    const data = await response.json();
    reply.innerHTML = data.reply;
  } catch (error) {
    console.error('Error:', error.message);
    reply.innerHTML = 'Sorry, something went wrong. Please try again.';
  }
}
