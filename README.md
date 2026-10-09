# 🌊 Ocean Viz

An interactive **3D ocean data visualization platform**. Explore global sea surface temperature (SST) on a rotating Earth, inspect real buoy readings, click anywhere on the globe for point data, and get an AI-written outlook for any location.

Built for **Smart India Hackathon (SIH)** — Bennett University.

> **Screenshots:** add images to a `docs/` folder and link them here, e.g. `![Globe view](docs/globe.png)`.

---

## ✨ Features

- **3D globe** (React Three Fiber / Three.js) with day/night lighting, atmosphere, and clouds
- **Multiple view modes:** Surface SST texture, Marine Heatwaves, Satellite, and Grid points
- **Real data:** NOAA OISST satellite sea surface temperature (global grid) and NDBC buoy observations (buoy 41002)
- **Click anywhere** on the globe to get a popup with temperature, depth, wave height, and salinity
- **Ocean layers:** ocean currents, deep-sea trenches, coral reefs, and place labels (toggleable)
- **Tools:** depth panel and depth slicer, transect tool (point A → B), GPS panel, search bar, colormap picker
- **Seasonal simulation** with month playback, plus a **Zen mode** for a clean cinematic view
- **AI outlook** for any selected point, powered by Groq (optional)
- **Offline fallback:** if the backend is unreachable, the app falls back to a generated grid instead of crashing
- **Phone-friendly:** open the dev URL from your phone on the same Wi-Fi

> **Data note:** SST and buoy values are real. Depth, wave height, and salinity in the click popup are **illustrative** (labelled as such in the UI). The AI outlook is a language-model narrative, **not** a physical forecast.

---

## 🧱 Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite, Three.js, @react-three/fiber, @react-three/drei |
| Backend | Python, FastAPI, Uvicorn, xarray, netCDF4, pandas, numpy, httpx |
| Data | NOAA OISST (`.nc`), NDBC buoy 41002 (`.csv`) |
| AI (optional) | Groq chat completions API |

---

## 📁 Project Structure

```
SIH1/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app + CORS + router wiring
│   │   ├── routers/           # health, sst, buoy, predict
│   │   └── services/          # sst_service, buoy_service
│   ├── data/                  # oisst_global.nc, oisst.nc, buoy_41002.csv
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/                   # Scene, OceanPanel, panels, tools, data helpers
│   ├── public/textures/       # Earth textures
│   ├── package.json
│   └── .env.example
├── run.sh                     # One-command launcher (macOS)
└── README.md
```

---

## ✅ Prerequisites

- **Python 3.10+** (3.11 recommended)
- **Node.js 18+** (LTS) and npm
- *(Optional)* a free **Groq API key** from [console.groq.com](https://console.groq.com) for the AI outlook

---

## 🚀 Quick Start

### macOS (one command)

```bash
chmod +x run.sh
./run.sh
```

This creates the virtual environment, installs dependencies, starts both servers, and opens the app in your browser. Press `Ctrl+C` to stop.

### Manual setup (macOS / Linux)

**Terminal 1 — Backend**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export GROQ_API_KEY="your_key_here"    # optional
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm install
npm run dev
```

### Manual setup (Windows PowerShell)

**Terminal 1 — Backend**

```powershell
cd backend
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:GROQ_API_KEY = "your_key_here"    # optional
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

If activation is blocked, run `Set-ExecutionPolicy -Scope Process Bypass` first.

**Terminal 2 — Frontend**

```powershell
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173**.

| Service | URL |
|---|---|
| App | http://localhost:5173 |
| API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |

---

## 🔑 Environment Variables

**Backend** — copy `backend/.env.example` to `backend/.env`:

```
GROQ_API_KEY=your_key_here
```

> The backend reads `GROQ_API_KEY` from the environment. `run.sh` exports it from `backend/.env` for you; when running manually, export it in your terminal as shown above. Without a key, everything works except the AI outlook (the endpoint returns a clear 503 message).

**Frontend** — optional, in `frontend/.env`:

```
VITE_API_BASE_URL=https://your-backend.example.com
```

Only needed when the frontend and backend are deployed on different hosts. Locally, the app auto-detects the backend (`localhost:8000`, or the same host on port 8000 when opened via a LAN IP).

⚠️ **Never commit `.env` files.** They are listed in `.gitignore`.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/sst/grid` | Sampled global SST grid (`latitude`, `longitude`, `sst_celsius`) |
| GET | `/api/sst?latitude=..&longitude=..` | SST at a single point (longitude in -180 to 180) |
| GET | `/api/buoy/latest` | Most recent buoy observation |
| GET | `/api/buoy/history?limit=50` | Recent buoy readings (1–1000, newest first) |
| POST | `/api/predict` | AI-written outlook for a point (needs `GROQ_API_KEY`) |

Example:

```bash
curl "http://localhost:8000/api/sst?latitude=38.5&longitude=-60"
```

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| "Loading ocean data..." never finishes | Backend isn't running. Start it and check http://localhost:8000/api/health |
| Port 8000 or 5173 already in use | Stop the other process, or change the port in the run command |
| `netCDF4` fails to install | Upgrade pip (`python -m pip install --upgrade pip`) and use Python 3.10–3.12 |
| AI outlook returns 503 | `GROQ_API_KEY` isn't set in the terminal that started the backend |
| Phone can't load data | Open the app via the `Network:` URL Vite prints, on the same Wi-Fi as your computer |

---

## 🗺️ Roadmap

- More real buoy stations
- Real depth, wave, and salinity datasets in place of illustrative values
- Time-series SST playback from multi-day OISST files
- Public deployment (frontend on Vercel/Netlify, backend on Render/Fly)

---

## 👥 Team

**Catalyst Crew** — add member names and roles here.

## 🙏 Data Credits

- **NOAA OISST** — Optimum Interpolation Sea Surface Temperature
- **NOAA NDBC** — National Data Buoy Center
- Earth textures — add the source and license of the textures in `frontend/public/textures/`

## 📄 License

All rights reserved
