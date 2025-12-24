# Kien Portfolio — Run Guide (Windows)

Minimal instructions to run the current code locally.

## Prerequisites
- Python 3.11+ installed

## Start the backend (Flask)

### 1. Create `.env` file (REQUIRED)
Create a file named `.env` in the `backend/` folder with your configuration:

```env
# Required: Your API Key
OPENAI_API_KEY=your_api_key_here

# Required: Model to use
# For OpenAI: gpt-3.5-turbo, gpt-4, gpt-4-turbo
# For custom endpoints: DeepSeek-V3, etc.
MODEL_NAME=gpt-3.5-turbo

# Optional: Custom API endpoint (leave empty for official OpenAI)
# Example: https://aiportalapi.stu-platform.live/use
BASE_URL=
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
## Deploy to Production

### Backend (Render)
- Ensure `render.yaml` is committed at the repo root.
- Push to GitHub and create a new service on Render using "Blueprint".
- Set environment variables in Render:
	- `OPENAI_API_KEY`: your provider key
	- `MODEL_NAME`: e.g., `gpt-3.5-turbo` or `DeepSeek-V3`
	- `BASE_URL`: leave empty for OpenAI; set custom endpoint URL if using another provider
	- `FRONTEND_ORIGIN`: your site origin, e.g., `https://www.yourdomain.com`
- After deploy, note your backend URL, e.g., `https://portfolio-backend.onrender.com` or a custom `https://api.yourdomain.com`.

### Frontend (GitHub Pages + Custom Domain)
- The static site lives in `frontend/`. GitHub Pages serves from the repo with the existing `CNAME` file.
- Steps:
	1. Push to GitHub
	2. In GitHub → Settings → Pages → Source: `Deploy from a branch`, choose root/main
	3. Ensure `CNAME` contains your domain (e.g., `www.yourdomain.com`)
	4. Configure DNS at your registrar:
		 - If using `www.yourdomain.com`: add a CNAME pointing to `<yourusername>.github.io`
		 - For apex `yourdomain.com`: add ALIAS/ANAME to GitHub Pages (or A records to GitHub IPs if registrar supports)

### Point frontend to backend
- Set the public backend URL into `frontend/js/config.js` like:
```
// frontend/js/config.js
window.KB_API_BASE_URL = 'https://api.yourdomain.com';
```
- Alternatively, set `FRONTEND_ORIGIN` in the backend and keep `config.js` unset when testing locally.

### Smoke Test
1. Open your domain in a browser
2. Verify the status indicator shows connected
3. Send a message and confirm responses

### Troubleshooting
- 401 Unauthorized: Check `OPENAI_API_KEY` and provider access
- CORS errors: Set `FRONTEND_ORIGIN` to your site origin (e.g., `https://www.yourdomain.com`)
- Frontend still calling localhost: Ensure `frontend/js/config.js` is set and published
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
