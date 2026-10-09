// Talks to the real backend (Person B's FastAPI server).
//
// Base URL resolution, in priority order:
//   1. VITE_API_BASE_URL, if set (e.g. in a .env file) — for the deployed
//      version, where the backend lives at its own domain. See .env.example.
//   2. If the page itself was opened via a LAN/network address rather than
//      localhost (this is exactly what happens when you open the printed
//      "Network:" URL from `npm run dev` on your phone), assume the backend
//      is reachable on that same host, port 8000. Plain `localhost` would
//      resolve to the *phone itself* in that case, not your dev machine —
//      this is the fix for the "your phone needs the backend's real address"
//      gap called out below in the Step 1.4 notes.
//   3. Otherwise, the original default: http://localhost:8000.
const API_BASE = resolveApiBase()
export { API_BASE }

function resolveApiBase() {
  const envBase = import.meta.env.VITE_API_BASE_URL?.trim()
  if (envBase) return envBase.replace(/\/$/, '')

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:8000`
    }
  }

  return 'http://localhost:8000'
}

// Wraps fetch with a timeout so a backend that's down (rather than
// returning an error) fails fast with a clear message instead of leaving
// the loading screen spinning indefinitely.
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s. Is the backend running at ${API_BASE}?`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

async function getJSON(path, { timeoutMs = 10000 } = {}) {
  // Data endpoints are polled for updates; bypass the browser cache so a
  // refresh really asks the configured backend for its latest snapshot.
  const res = await fetchWithTimeout(`${API_BASE}${path}`, { cache: 'no-store' }, timeoutMs)
  if (!res.ok) {
    throw new Error(`Request to ${path} failed: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

async function postJSON(path, body, { timeoutMs = 20000 } = {}) {
  const res = await fetchWithTimeout(
    `${API_BASE}${path}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    timeoutMs
  )
  if (!res.ok) {
    // Try to surface the backend's detail message (e.g. "GROQ_API_KEY not set")
    // rather than a generic status code.
    let detail = `${res.status} ${res.statusText}`
    try {
      const errBody = await res.json()
      if (errBody?.detail) detail = errBody.detail
    } catch {
      // ignore parse failure, fall back to status text
    }
    throw new Error(detail)
  }
  return res.json()
}

// Global SST grid — sampled from NOAA OISST to keep the browser payload modest.
// The UI refreshes this snapshot periodically and on demand.
export function fetchSstGrid() {
  return getJSON('/api/sst/grid')
}

// Most recent single reading from the one real buoy station (41002).
export function fetchBuoyLatest() {
  return getJSON('/api/buoy/latest')
}

// Up to `limit` most recent readings, most recent first.
export function fetchBuoyHistory(limit = 10) {
  return getJSON(`/api/buoy/history?limit=${limit}`)
}

// Quick check used on startup to show a friendly message if the backend
// isn't running yet, instead of a confusing fetch error.
export function checkHealth() {
  return getJSON('/api/health')
}

// Asks the backend's /api/predict route (Groq-backed) for a short narrative
// outlook for a clicked point. `info` is the object built by pointInfo.js's
// buildPointInfo() — { latitude, longitude, tempC, isTempReal, depthM,
// waveM, salinityPsu }. Throws if GROQ_API_KEY isn't configured on the
// backend, or if the Groq call fails — callers should catch and show the
// error message, since it's usually actionable ("set GROQ_API_KEY").
export function predictConditions(info) {
  return postJSON('/api/predict', {
    latitude: info.latitude,
    longitude: info.longitude,
    temp_c: info.tempC,
    is_temp_real: info.isTempReal,
    depth_m: info.depthM,
    wave_m: info.waveM,
    salinity_psu: info.salinityPsu,
  })
}
