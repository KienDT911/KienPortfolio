# Quick Start Guide - AI Portfolio Chatbot

## Prerequisites
- Python 3.8+
- Pip (Python package manager)

## Setup & Run

### Step 1: Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Start the Backend Server
```bash
cd backend
python server.py
```

**Expected output:**
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

⚠️ **Common Issues:**
- If you see `ImportError` for `langgraph`, `langchain`, etc. → Run `pip install -r requirements.txt`
- If port 5000 is already in use → Change port in `server.py` line 42
- If API keys fail → Check that `ConversationIncluding.py` has valid OpenAI/LangSmith keys

### Step 3: Start the Frontend Server
Open a **new terminal** and run:
```bash
cd frontend
python -m http.server 8000
```

**Expected output:**
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

### Step 4: Open the App
Open your browser and go to:
```
http://localhost:8000
```

## Testing the Chatbot

1. **Look for the status message** - You should see either:
   - ✅ `Backend connected and ready!` — Everything works
   - ⚠️ `Backend not responding...` — Backend is not running

2. **Click the chat bubble** (bottom-right)

3. **Try asking a question:**
   - "Tell me a joke"
   - "What is AI?"
   - "How does machine learning work?"

4. **Monitor responses:**
   - ⏳ `Processing your request...` → Initial processing
   - ⏳ `Waiting for backend...` → Waiting for LLM response
   - Response appears → Backend processed successfully

## Troubleshooting

### ❌ "Backend is not responding"
- **Check:** Is `python server.py` running in the backend folder?
- **Fix:** Start backend in a new terminal
- **Port Issue:** Verify port 5000 is free: `netstat -an | findstr :5000`

### ❌ "Request timed out" 
- Backend is running but slow (30+ seconds)
- **Causes:** First request initializes LLM (slow), API rate limiting, network latency
- **Fix:** Wait longer, try simpler questions, check internet connection

### ❌ "Cannot reach backend"
- **Check:** Frontend is on `http://localhost:8000`
- **Check:** Backend is on `http://localhost:5000`
- **Fix:** Verify no firewall blocking localhost
- **Alt:** Update `API_BASE_URL` in `frontend/js/chatbot.js` line 2

### ❌ "ImportError" in backend
- Missing dependencies
- **Fix:** `pip install -r requirements.txt`

### ❌ Port already in use
```bash
# Kill process using port 5000
# Windows PowerShell:
taskkill /PID <PID> /F

# Or change port in server.py line 42
app.run(host="127.0.0.1", port=5001, debug=True)
```

## Features Added

✅ **Health Check** — Frontend checks if backend is online on page load  
✅ **Timeout Handling** — Requests timeout after 30 seconds with clear message  
✅ **Status Updates** — Real-time status: "Processing...", "Waiting for backend..."  
✅ **Error Messages** — Clear, actionable error messages with setup instructions  
✅ **Logging** — Backend logs all requests for debugging  
✅ **CORS Support** — Frontend and backend can communicate across ports  
✅ **Graceful Degradation** — Works even if backend is slow/unresponsive

## File Structure

```
KienPortfolio/
├── frontend/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── chatbot.js      (← Updated with health checks & error handling)
│       └── main.js
└── backend/
    ├── server.py           (← Updated with logging & better errors)
    ├── ConversationIncluding.py
    └── requirements.txt
```

## Next Steps

- Add authentication (API key for frontend)
- Deploy backend to cloud (Vercel, Railway, Fly.io)
- Add message persistence (database)
- Implement custom prompt templates
- Add voice input/output
