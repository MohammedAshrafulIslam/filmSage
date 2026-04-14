const form = document.getElementById('chatForm');
const input = document.getElementById('query');
const chatMessages = document.getElementById('chatMessages');
const welcome = document.getElementById('welcome');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');

// Suggestion chips
document.querySelectorAll('.suggestion-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const query = chip.dataset.query;
    if (query) {
      input.value = query;
      form.dispatchEvent(new Event('submit'));
    }
  });
});

// New chat
newChatBtn.addEventListener('click', () => {
  chatMessages.innerHTML = '';
  chatMessages.appendChild(createWelcome());
  input.value = '';
  input.focus();
});

function createWelcome() {
  const div = document.createElement('div');
  div.className = 'welcome';
  div.id = 'welcome';
  div.innerHTML = `
    <div class="welcome-icon">
      <span class="material-symbols-outlined">smart_toy</span>
    </div>
    <h1>What would you like to watch?</h1>
    <p class="welcome-sub">I'm your AI movie expert. Ask me for recommendations, trivia, or help picking your next film.</p>
    <div class="suggestions">
      <button class="suggestion-chip" data-query="What's a good sci-fi movie with mind-bending concepts?">
        <span class="material-symbols-outlined">psychology</span>
        Mind-bending sci-fi
      </button>
      <button class="suggestion-chip" data-query="Recommend a movie that won Best Picture at the Oscars">
        <span class="material-symbols-outlined">emoji_events</span>
        Oscar Best Picture winners
      </button>
      <button class="suggestion-chip" data-query="What animated movie would you recommend for a family?">
        <span class="material-symbols-outlined">family_restroom</span>
        Family-friendly animation
      </button>
      <button class="suggestion-chip" data-query="What's a great thriller with a twist ending?">
        <span class="material-symbols-outlined">mystery</span>
        Thrillers with twists
      </button>
    </div>
  `;
  div.querySelectorAll('.suggestion-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const query = chip.dataset.query;
      if (query) {
        input.value = query;
        form.dispatchEvent(new Event('submit'));
      }
    });
  });
  return div;
}

function addMessage(text, role) {
  const row = document.createElement('div');
  row.className = `message-row ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  const icon = document.createElement('span');
  icon.className = 'material-symbols-outlined';
  icon.textContent = role === 'ai' ? 'smart_toy' : 'person';
  avatar.appendChild(icon);

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

function addTypingIndicator() {
  const row = document.createElement('div');
  row.className = 'message-row ai';
  row.id = 'typingRow';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  const icon = document.createElement('span');
  icon.className = 'material-symbols-outlined';
  icon.textContent = 'smart_toy';
  avatar.appendChild(icon);

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

  bubble.appendChild(indicator);
  row.appendChild(avatar);
  row.appendChild(bubble);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('typingRow');
  if (el) el.remove();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  // Hide welcome screen
  const w = document.getElementById('welcome');
  if (w) w.remove();

  input.value = '';
  sendBtn.disabled = true;

  addMessage(query, 'user');
  addTypingIndicator();

  fetchReply(query);
});

async function fetchReply(query) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    removeTypingIndicator();

    if (response.status === 429) {
      addMessage('Too many requests. Please wait a moment and try again.', 'ai');
      return;
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error (${response.status})`);
    }

    const data = await response.json();
    addMessage(data.reply, 'ai');
  } catch (error) {
    removeTypingIndicator();
    console.error('Error:', error.message);
    addMessage('Sorry, something went wrong. Please try again.', 'ai');
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}
