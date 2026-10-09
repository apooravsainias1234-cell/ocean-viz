"""
Entry point for the Ocean Data Visualization API.

Run with:
    uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, sst, buoy, predict

# This is the core object that represents your whole web application.
# Every route (URL) you define gets "attached" to this app.
app = FastAPI(
    title="Ocean Data Visualization API",
    description="Backend serving OISST satellite SST data and NDBC buoy observations",
    version="0.1.0",
)

# CORS = Cross-Origin Resource Sharing.
# Browsers block a frontend (e.g. running on localhost:3000) from calling
# a backend on a different port (localhost:8000) unless the backend explicitly
# allows it. This middleware says "allow requests from anywhere" — fine for
# local dev, but you'd lock this down (allow_origins=["yourdomain.com"])
# before deploying publicly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# "Include" the router defined in health.py under the app.
# This is how you keep main.py small — each file in routers/ handles
# one topic area (health, sst data, buoy data, etc.) and main.py just
# wires them all together.
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(sst.router, prefix="/api", tags=["sst"])
app.include_router(buoy.router, prefix="/api", tags=["buoy"])
app.include_router(predict.router, prefix="/api", tags=["predict"])
