# Run the IBVAP command center on Windows

The dashboard talks directly to the existing FastAPI backend at
`http://127.0.0.1:8000/api/v1`. It uses the same API token for incident data,
health, zones, camera metadata, evidence images, and live MJPEG feeds.

## One-time setup

Open PowerShell in this folder and create the two environment files:

```powershell
Copy-Item .env.example .env
Copy-Item frontend\.env.example frontend\.env
```

Set a strong value for `IBVAP_API_TOKEN` in `.env`, then put **the exact same
value** in `frontend\.env` as `VITE_API_TOKEN`. The frontend file should also
keep this local API address:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_WS_URL=ws://127.0.0.1:8000/ws/alerts
```

Create the Python environment and install the backend dependencies:

```powershell
py -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Install the web dependencies:

```powershell
cd frontend
npm ci
```

## Start the connected app

In the first PowerShell window, from the project root:

```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn integration.api:app --host 127.0.0.1 --port 8000
```

In a second PowerShell window:

```powershell
cd frontend
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`.

To populate the dashboard with annotated camera feeds and new incidents, run
the existing pipeline separately with `python app.py` after configuring
`CAMERA_SOURCES` and model paths in `.env`. The UI reports real unavailable
states instead of showing demo data when the API, pipeline, or camera streams
are not available.
