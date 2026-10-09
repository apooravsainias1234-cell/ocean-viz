#!/usr/bin/env bash
# run.sh - one-command launcher for the Ocean Viz project (FastAPI backend + Vite frontend)
# Usage: ./run.sh        (Ctrl+C stops everything)

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
RUN_DIR="$ROOT/.run"
LOG_DIR="$RUN_DIR/logs"
VENV="$BACKEND/.venv"
API_PORT=8000
WEB_PORT=5173
URL="http://localhost:$WEB_PORT"

mkdir -p "$LOG_DIR"

# ---------- pretty output ----------
c_ok="\033[32m"; c_err="\033[31m"; c_info="\033[36m"; c_off="\033[0m"
info() { printf "${c_info}==>${c_off} %s\n" "$*"; }
ok()   { printf "${c_ok}OK${c_off}  %s\n" "$*"; }
die()  { printf "${c_err}ERROR:${c_off} %s\n" "$*" >&2; exit 1; }

# ---------- PATH fixes (Terminal/AppleScript often miss Homebrew + nvm) ----------
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
fi

# ---------- prerequisites ----------
command -v python3 >/dev/null 2>&1 || die "python3 not found. Install it: brew install python"
command -v node    >/dev/null 2>&1 || die "node not found. Install it: brew install node"
command -v npm     >/dev/null 2>&1 || die "npm not found. Install it: brew install node"

# ---------- optional env (GROQ_API_KEY for the AI prediction feature) ----------
# The backend does not call load_dotenv(), so we export the vars here instead.
if [ -f "$BACKEND/.env" ]; then
  set -a; . "$BACKEND/.env"; set +a
fi

# Auto-add the Groq key: ask once, save to backend/.env, never ask again.
# Press Enter to skip (AI prediction then falls back to local synthesis).
if [ -z "${GROQ_API_KEY:-}" ]; then
  printf "${c_info}==>${c_off} Paste your GROQ_API_KEY (get one at console.groq.com) or press Enter to skip: "
  read -r -s GROQ_INPUT; echo
  if [ -n "$GROQ_INPUT" ]; then
    printf "GROQ_API_KEY=%s\n" "$GROQ_INPUT" >> "$BACKEND/.env"
    chmod 600 "$BACKEND/.env"
    export GROQ_API_KEY="$GROQ_INPUT"
    ok "Saved key to backend/.env"
  else
    info "Skipped - AI prediction will use local fallback."
  fi
fi
[ -n "${GROQ_API_KEY:-}" ] && ok "GROQ_API_KEY loaded"

# ---------- port helpers ----------
port_in_use() { lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

if port_in_use "$API_PORT"; then
  die "Port $API_PORT is already in use. Stop whatever is using it: lsof -nP -iTCP:$API_PORT -sTCP:LISTEN"
fi
if port_in_use "$WEB_PORT"; then
  die "Port $WEB_PORT is already in use. Stop whatever is using it: lsof -nP -iTCP:$WEB_PORT -sTCP:LISTEN"
fi

# ---------- backend setup (venv + deps, reinstalled only if requirements.txt changed) ----------
if [ ! -d "$VENV" ]; then
  info "Creating Python virtual environment..."
  python3 -m venv "$VENV" || die "Could not create venv."
fi

REQ_HASH="$(shasum "$BACKEND/requirements.txt" | awk '{print $1}')"
if [ "$(cat "$VENV/.req_hash" 2>/dev/null)" != "$REQ_HASH" ]; then
  info "Installing backend dependencies (first run takes a minute)..."
  "$VENV/bin/python" -m pip install --quiet --upgrade pip
  "$VENV/bin/python" -m pip install --quiet -r "$BACKEND/requirements.txt" \
    || die "pip install failed."
  echo "$REQ_HASH" > "$VENV/.req_hash"
fi
ok "Backend dependencies ready"

# ---------- frontend setup (npm install only if needed) ----------
LOCK_HASH="$(shasum "$FRONTEND/package-lock.json" | awk '{print $1}')"
if [ ! -d "$FRONTEND/node_modules/.bin" ] || [ "$(cat "$FRONTEND/node_modules/.lock_hash" 2>/dev/null)" != "$LOCK_HASH" ]; then
  info "Installing frontend dependencies..."
  (cd "$FRONTEND" && npm install --no-audit --no-fund) || die "npm install failed."
  echo "$LOCK_HASH" > "$FRONTEND/node_modules/.lock_hash"
fi
ok "Frontend dependencies ready"

# ---------- cleanup on exit ----------
PIDS=()
cleanup() {
  trap - EXIT INT TERM
  echo
  info "Shutting down..."
  for pid in "${PIDS[@]:-}"; do
    [ -n "$pid" ] && kill "$pid" 2>/dev/null
  done
  # vite/uvicorn can leave children behind; free the ports explicitly
  for p in "$API_PORT" "$WEB_PORT"; do
    lsof -nP -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null
  done
  ok "Stopped."
  exit 0
}
trap cleanup EXIT INT TERM

# ---------- start backend ----------
info "Starting backend on :$API_PORT ..."
(cd "$BACKEND" && exec "$VENV/bin/python" -m uvicorn app.main:app \
  --host 0.0.0.0 --port "$API_PORT") >"$LOG_DIR/backend.log" 2>&1 &
PIDS+=($!)

# wait for /api/health (up to ~60s; xarray/netCDF import can be slow the first time)
for i in $(seq 1 60); do
  if curl -fs "http://localhost:$API_PORT/api/health" >/dev/null 2>&1; then
    ok "Backend is healthy"
    break
  fi
  if ! kill -0 "${PIDS[0]}" 2>/dev/null; then
    tail -n 25 "$LOG_DIR/backend.log"
    die "Backend crashed on startup. Full log: $LOG_DIR/backend.log"
  fi
  sleep 1
  if [ "$i" -eq 60 ]; then
    tail -n 25 "$LOG_DIR/backend.log"
    die "Backend did not become healthy in 60s. Full log: $LOG_DIR/backend.log"
  fi
done

# ---------- start frontend ----------
info "Starting frontend on :$WEB_PORT ..."
(cd "$FRONTEND" && exec npm run dev -- --port "$WEB_PORT" --strictPort) \
  >"$LOG_DIR/frontend.log" 2>&1 &
PIDS+=($!)

for i in $(seq 1 45); do
  if curl -fs "$URL" >/dev/null 2>&1; then
    ok "Frontend is up"
    break
  fi
  if ! kill -0 "${PIDS[1]}" 2>/dev/null; then
    tail -n 25 "$LOG_DIR/frontend.log"
    die "Frontend crashed on startup. Full log: $LOG_DIR/frontend.log"
  fi
  sleep 1
  if [ "$i" -eq 45 ]; then
    tail -n 25 "$LOG_DIR/frontend.log"
    die "Frontend did not start in 45s. Full log: $LOG_DIR/frontend.log"
  fi
done

# ---------- open browser ----------
if open -Ra "Google Chrome" 2>/dev/null; then
  open -a "Google Chrome" "$URL"
else
  info "Google Chrome not found - opening default browser."
  open "$URL" 2>/dev/null || true
fi

echo
printf "${c_ok}Ocean Viz is running${c_off}\n"
echo "  App:      $URL"
echo "  API docs: http://localhost:$API_PORT/docs"
echo "  Logs:     $LOG_DIR"
echo "  Press Ctrl+C (or close this window) to stop."
echo

# keep the script alive; exit if either server dies
while kill -0 "${PIDS[0]}" 2>/dev/null && kill -0 "${PIDS[1]}" 2>/dev/null; do
  sleep 2
done
die "A server stopped unexpectedly. Check logs in $LOG_DIR"
