(function () {
  const API_BASE_URL = (typeof window !== 'undefined' && window.KB_API_BASE_URL) ? window.KB_API_BASE_URL : 'http://localhost:5000';
  const API_TIMEOUT = 30000; // 30 second timeout
  let isConnected = false;
  
  // Generate unique session ID on page load - resets on refresh
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  console.log('New session started:', sessionId);

  // Check backend connectivity on load
  async function checkBackendHealth() {
    updateStatusIndicator('checking');
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        timeout: 5000
      });
      isConnected = response.ok;
      updateStatusIndicator(isConnected ? 'connected' : 'disconnected');
      console.log('Backend health:', isConnected ? 'Connected' : 'Disconnected');
      return isConnected;
    } catch (error) {
      console.error('Backend health check failed:', error);
      isConnected = false;
      updateStatusIndicator('disconnected');
      return false;
    }
  }

  function ensureUI() {
    if (document.getElementById('kb-chat-toggle')) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'kb-chat-toggle';
    toggleBtn.setAttribute('aria-label', "Open chat");
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10.5l-4.5 4.5V17H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
      </svg>`;

    const panel = document.createElement('div');
    panel.id = 'kb-chat-panel';
    panel.innerHTML = `
      <div class="resize-handle resize-tl"></div>
      <div class="resize-handle resize-tr"></div>
      <div class="resize-handle resize-bl"></div>
      <div class="resize-handle resize-br"></div>
      <div class="kbc-header" role="heading" aria-level="2">
        <div class="kbch-title">AI Assistant</div>
        <button class="kbch-close" aria-label="Close chat">×</button>
      </div>
      <div class="kbc-body">
        <div class="kbc-messages" id="kb-chat-messages" aria-live="polite"></div>
        <div class="kb-suggestions" id="kb-chat-suggestions"></div>
      </div>
      <form class="kb-chat-input" id="kb-chat-form" autocomplete="off">
        <input type="text" id="kb-chat-text" placeholder="Ask me anything..." aria-label="Chat input" />
        <button type="submit" class="kb-send">Send</button>
      </form>
    `;

    document.body.appendChild(toggleBtn);
    document.body.appendChild(panel);

    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) {
        setTimeout(() => document.getElementById('kb-chat-text')?.focus(), 50);
      }
    });

    panel.querySelector('.kbch-close')?.addEventListener('click', () => panel.classList.remove('open'));

    // Prevent page scrolling when mouse is inside chatbox
    panel.addEventListener('wheel', (e) => {
      const messagesContainer = document.getElementById('kb-chat-messages');
      if (messagesContainer) {
        const hasScroll = messagesContainer.scrollHeight > messagesContainer.clientHeight;
        const isAtTop = messagesContainer.scrollTop === 0;
        const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight;
        
        // Prevent page scroll in all cases when mouse is inside chatbox
        if (hasScroll) {
          // If content is scrollable, only prevent if not at boundary or scrolling into content
          if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
            e.stopPropagation();
          }
        } else {
          // If no scrollable content, always prevent page scroll
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }, { passive: false });

    // Add resize functionality to all corners (anchored bottom-right)
    initResize(panel);
  }

  function initResize(panel) {
    const minWidth = 280;
    const minHeight = 340; // keep input visible
    const maxWidth = () => window.innerWidth - 40;
    const maxHeight = () => window.innerHeight - 120;
    let isResizing = false;
    let currentHandle = null;
    let startX, startY, startWidth, startHeight;

    const handles = panel.querySelectorAll('.resize-handle');
    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        currentHandle = handle;
        startX = e.clientX;
        startY = e.clientY;

        const rect = panel.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;

        e.preventDefault();
        e.stopPropagation();
        document.body.style.cursor = window.getComputedStyle(handle).cursor;
      });
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing || !currentHandle) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const clampWidth = (w) => Math.min(maxWidth(), Math.max(minWidth, w));
      const clampHeight = (h) => Math.min(maxHeight(), Math.max(minHeight, h));

      if (currentHandle.classList.contains('resize-br')) {
        const newWidth = clampWidth(startWidth + deltaX);
        const newHeight = clampHeight(startHeight + deltaY);
        panel.style.width = newWidth + 'px';
        panel.style.height = newHeight + 'px';
      } else if (currentHandle.classList.contains('resize-bl')) {
        const newWidth = clampWidth(startWidth - deltaX);
        const newHeight = clampHeight(startHeight + deltaY);
        panel.style.width = newWidth + 'px';
        panel.style.height = newHeight + 'px';
      } else if (currentHandle.classList.contains('resize-tr')) {
        const newWidth = clampWidth(startWidth + deltaX);
        const newHeight = clampHeight(startHeight - deltaY);
        panel.style.width = newWidth + 'px';
        panel.style.height = newHeight + 'px';
      } else if (currentHandle.classList.contains('resize-tl')) {
        const newWidth = clampWidth(startWidth - deltaX);
        const newHeight = clampHeight(startHeight - deltaY);
        panel.style.width = newWidth + 'px';
        panel.style.height = newHeight + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        currentHandle = null;
        document.body.style.cursor = '';
      }
    });
  }

  async function callBackendAPI(message) {
    try {
      // Check backend is reachable
      if (!isConnected) {
        const healthOk = await checkBackendHealth();
        if (!healthOk) {
          return `❌ Backend is not responding. Please make sure the server is running on port 5000.\n\nRun in terminal:\ncd backend\npython server.py`;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_id: sessionId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        try {
          const errorData = await response.json();
          return `⚠️ Server Error: ${errorData.error || 'Unknown error'}`;
        } catch {
          return `⚠️ Server Error: HTTP ${response.status}`;
        }
      }

      const data = await response.json();
      return data.reply || 'No response from backend';
    } catch (error) {
      if (error.name === 'AbortError') {
        return `⏱️ Request timed out. The backend took too long to respond (${API_TIMEOUT / 1000} seconds). Please try again.`;
      }
      console.error('Backend API error:', error);
      return `❌ Cannot reach backend. Error: ${error.message}\n\nMake sure:\n1. Backend is running: python server.py\n2. Port 5000 is accessible\n3. No firewall blocking localhost:5000`;
    }
  }

  function toggleInputDisabled(disabled) {
    const input = document.getElementById('kb-chat-text');
    const btn = document.querySelector('.kb-send');
    if (input) input.disabled = disabled;
    if (btn) btn.disabled = disabled;
  }

  function updateStatusIndicator(status) {
    const indicator = document.getElementById('backend-status-dot');
    if (!indicator) return;

    indicator.classList.remove('connected', 'disconnected', 'checking');
    
    switch (status) {
      case 'connected':
        indicator.classList.add('connected');
        indicator.title = '✅ Backend: Connected';
        console.log('Status indicator: CONNECTED');
        break;
      case 'disconnected':
        indicator.classList.add('disconnected');
        indicator.title = '❌ Backend: Disconnected';
        console.log('Status indicator: DISCONNECTED');
        break;
      case 'checking':
        indicator.classList.add('checking');
        indicator.title = '⏳ Backend: Checking...';
        console.log('Status indicator: CHECKING');
        break;
      default:
        indicator.classList.add('checking');
    }
  }

  function scrapeKnowledge() {
    const docs = [];

    const hero = document.querySelector('#home .hero-text');
    if (hero) {
      docs.push({ id: 'home', title: 'Home', text: hero.innerText.trim() });
    }

    const about = document.querySelector('#about');
    if (about) {
      const header = about.querySelector('h2')?.innerText || 'About';
      const text = about.querySelector('.about-text')?.innerText || '';
      docs.push({ id: 'about', title: header, text: text.trim() });

      about.querySelectorAll('.skill').forEach((el, idx) => {
        const t = el.querySelector('h3')?.innerText || 'Skill';
        const p = el.querySelector('p')?.innerText || '';
        docs.push({ id: `skill-${idx}`, title: `Skill: ${t}`, text: `${t}: ${p}` });
      });
    }

    const projects = document.querySelector('#projects');
    if (projects) {
      projects.querySelectorAll('.project-card').forEach((card, idx) => {
        const t = card.querySelector('h3')?.innerText || `Project ${idx+1}`;
        const p = card.querySelector('p')?.innerText || '';
        const a = card.querySelector('a')?.getAttribute('href') || '';
        const link = a ? ` Link: ${a}` : '';
        docs.push({ id: `project-${idx}`, title: `Project: ${t}`, text: `${t}. ${p}.${link}` });
      });
    }

    const contact = document.querySelector('#contact');
    if (contact) {
      const header = contact.querySelector('h2')?.innerText || 'Contact';
      const intro = contact.querySelector('.contact-intro')?.innerText || '';
      const socials = Array.from(contact.querySelectorAll('.social-links a'))
        .map(a => `${a.innerText.trim()}${a.href ? `: ${a.href}` : ''}`)
        .join(' | ');
      const text = [intro, socials].filter(Boolean).join(' ');
      docs.push({ id: 'contact', title: header, text: text.trim() });
    }

    // Filter out empty
    return docs.filter(d => (d.text || '').trim().length > 0);
  }

  function tokenize(str) {
    return (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w && !STOP_WORDS.has(w));
  }

  function buildTfidf(docs) {
    const tokenDocs = docs.map(d => tokenize(`${d.title} ${d.text}`));
    const vocab = new Map(); // term -> index
    const df = new Map(); // term -> doc freq

    tokenDocs.forEach(tokens => {
      const seen = new Set();
      tokens.forEach(t => {
        if (!vocab.has(t)) vocab.set(t, vocab.size);
        if (!seen.has(t)) {
          seen.add(t);
          df.set(t, (df.get(t) || 0) + 1);
        }
      });
    });

    const N = docs.length;
    const idf = new Float32Array(vocab.size);
    vocab.forEach((idx, term) => {
      const dfi = df.get(term) || 1;
      idf[idx] = Math.log((N + 1) / (dfi + 0.5)) + 1; // smoothed IDF
    });

    function vectorize(tokens) {
      const tf = new Map();
      tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
      const vec = new Float32Array(vocab.size);
      let norm = 0;
      tf.forEach((cnt, term) => {
        const idx = vocab.get(term);
        if (idx === undefined) return;
        const val = (cnt / tokens.length) * idf[idx];
        vec[idx] = val;
        norm += val * val;
      });
      const len = Math.sqrt(norm) || 1;
      for (let i = 0; i < vec.length; i++) vec[i] /= len;
      return vec;
    }

    const docVectors = tokenDocs.map(vectorize);

    function cosine(a, b) {
      let s = 0;
      const L = a.length;
      for (let i = 0; i < L; i++) s += a[i] * b[i];
      return s;
    }

    function query(q) {
      const qv = vectorize(tokenize(q));
      const scores = docVectors.map((dv, i) => ({ i, score: cosine(qv, dv) }));
      scores.sort((x, y) => y.score - x.score);
      return scores;
    }

    return { query };
  }

  function splitSentences(text) {
    return (text || '')
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  function formatAnswer(q, docsRanked, allDocs, topK = 3, minScore = 0.12) {
    const top = docsRanked.filter(d => d.score >= minScore).slice(0, topK);
    if (top.length === 0) {
      return {
        text: "I can help with Kien's portfolio only (skills, projects, experience, contact). Please ask something related.",
        sources: []
      };
    }

    const qTokens = new Set(tokenize(q));
    const snippets = [];
    const sources = [];

    top.forEach(({ i, score }) => {
      const d = allDocs[i];
      if (!d) return;
      sources.push({ title: d.title, id: d.id, score: Number(score.toFixed(3)) });
      const sents = splitSentences(d.text);
      const picked = [];
      for (const s of sents) {
        const st = tokenize(s);
        const overlap = st.filter(t => qTokens.has(t)).length;
        if (overlap > 0) picked.push(s);
        if (picked.length >= 2) break;
      }
      if (picked.length === 0 && sents.length) picked.push(sents[0]);
      if (picked.length) snippets.push(`• ${picked.join(' ')}`);
    });

    const answer = snippets.join('\n');
    return { text: answer || allDocs[top[0].i].text, sources };
  }

  // Typing effect for bot messages
  async function typeMessage(element, text, speed = 20) {
    element.innerText = '';
    const list = document.getElementById('kb-chat-messages');
    
    for (let i = 0; i < text.length; i++) {
      element.innerText += text[i];
      if (list) list.scrollTop = list.scrollHeight;
      await new Promise(resolve => setTimeout(resolve, speed));
    }
  }

  function addMessage(role, text, messageId = null, useTyping = false) {
    const list = document.getElementById('kb-chat-messages');
    if (!list) return;
    const item = document.createElement('div');
    item.className = `kb-msg ${role}`;
    item.id = messageId;
    
    if (useTyping && role === 'bot') {
      item.innerText = '';
      list.appendChild(item);
      list.scrollTop = list.scrollHeight;
      typeMessage(item, text);
    } else {
      item.innerText = text;
      list.appendChild(item);
      list.scrollTop = list.scrollHeight;
    }
    
    return item;
  }

  function setSuggestions(suggestions) {
    const box = document.getElementById('kb-chat-suggestions');
    if (!box) return;
    box.innerHTML = '';
    suggestions.forEach(s => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'kb-suggestion';
      b.textContent = s;
      b.addEventListener('click', () => {
        const input = document.getElementById('kb-chat-text');
        if (input) input.value = s;
        document.getElementById('kb-chat-form')?.dispatchEvent(new Event('submit', { cancelable: true }));
      });
      box.appendChild(b);
    });
  }

  function init() {
    ensureUI();

    setSuggestions([
      'What is AI?',
      'Tell me a joke',
      'How does machine learning work?',
      'What are some fun facts?'
    ]);

    // Clear any previous messages from DOM (ensures fresh start on page refresh)
    const messageContainer = document.getElementById('kb-chat-messages');
    if (messageContainer) {
      messageContainer.innerHTML = '';
    }

    // Welcome and check backend status
    addMessage('bot', "Hi! I'm an AI assistant. Feel free to ask me anything!");
    
    // Perform health check when page loads
    checkBackendHealth().then(ok => {
      if (ok) {
        addMessage('bot', '✅ Backend connected and ready!', 'status-msg');
      } else {
        addMessage('bot', '⚠️ Backend not responding. Please start the server:\ncd backend\npython server.py', 'status-msg');
      }
    });

    // Also check every 10 seconds to update indicator
    setInterval(() => {
      checkBackendHealth();
    }, 10000);

    const form = document.getElementById('kb-chat-form');
    const input = document.getElementById('kb-chat-text');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = (input?.value || '').trim();
      if (!q) return;

      // Hide suggestions after first message
      const suggestionsBox = document.getElementById('kb-chat-suggestions');
      if (suggestionsBox) suggestionsBox.style.display = 'none';

      addMessage('user', q);
      input.value = '';
      toggleInputDisabled(true);
      updateStatusIndicator('checking'); // Show checking status while processing

      // Show processing status
      const loadingMsgId = 'loading-' + Date.now();
      addMessage('loading', '⏳ Processing your request...', loadingMsgId);

      try {
        // Update status - checking backend
        const loadingEl = document.getElementById(loadingMsgId);
        if (loadingEl) loadingEl.innerText = '⏳ Waiting for backend...';

        const reply = await callBackendAPI(q);
        
        // Update indicator based on success
        if (reply.includes('❌') || reply.includes('⚠️') || reply.includes('⏱️')) {
          updateStatusIndicator('disconnected');
        } else {
          updateStatusIndicator('connected');
        }
        
        // Remove loading message
        const messages = document.getElementById('kb-chat-messages');
        const lastMsg = messages?.lastChild;
        if (lastMsg?.id === loadingMsgId) {
          lastMsg.remove();
        }
        
        // Show response with typing effect
        addMessage('bot', reply, null, true);
      } catch (err) {
        console.error('Error:', err);
        updateStatusIndicator('disconnected');
        addMessage('bot', `❌ Error: ${err.message || 'Something went wrong. Please try again.'}`);
      } finally {
        toggleInputDisabled(false);
        input?.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
