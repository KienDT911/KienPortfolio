# Kien Portfolio — Run Guide (Windows)

Minimal instructions to run the current code locally.

## Prerequisites
- Python 3.11+ installed

## Start the backend (Flask)

### 1. Create `.env` file (REQUIRED)
Create a file named `.env` in the `backend/` folder with your API keys:
```env
OPENAI_API_KEY=your_openai_key_here
```

Optional LangSmith configuration (for debugging):
```env
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_key
LANGSMITH_PROJECT=your_project_name
```

**Note:** The `.env` file is already in `.gitignore` and won't be committed to git.

### 2. Install and run
```powershell
# From repo root
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python backend/server.py
# Server runs at http://127.0.0.1:5000 (health: /health)
```

### Backend — Detailed Steps & Checks
- Create and activate venv: `python -m venv .venv` then `.\.venv\Scripts\Activate.ps1`.
- Install deps: `pip install -r backend/requirements.txt`.
- Start server: `python backend/server.py`.
- Verify health: open http://127.0.0.1:5000/health — should show `{ status: "ok" }`.
- Test chat API:
	```powershell
	$body = '{"message":"Hello"}';
	Invoke-WebRequest -Uri "http://127.0.0.1:5000/chat" -Method POST -ContentType "application/json" -Body $body | Select-Object -ExpandProperty Content
	```

### Notes
- The server binds to `127.0.0.1:5000`; CORS in `backend/server.py` allows localhost.
- Debug/reloader are disabled for Windows stability.
- API keys are loaded from `backend/.env` using `python-dotenv`.

### Common Issues
- If Windows shows socket/reloader errors, stop any running Python processes and restart:
	```powershell
	Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force
	python backend/server.py
	```
- If health is ok but frontend dot says Disconnected, hard refresh the browser or use an InPrivate window.

## Start the frontend (static site)
```powershell
cd frontend
python -m http.server 8000
# Open http://localhost:8000 in your browser
```

## Use it
- The AI chat widget appears on the right; it connects to the backend.
- A status dot in the navbar shows Backend Connected/Disconnected.

That’s it — no other steps required.
