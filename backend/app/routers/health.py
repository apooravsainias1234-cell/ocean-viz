"""
Health check endpoint.

Purpose: lets you (or a monitoring tool, or your future frontend) quickly
verify the server is up and responding, without hitting any real data logic.
This is a very common pattern in real backends.
"""

from fastapi import APIRouter

# An APIRouter is a mini-FastAPI-app. You define routes on it here,
# then "include" it into the main app (see main.py). This keeps each
# feature area in its own file instead of one giant main.py.
router = APIRouter()


# This decorator says: "when someone sends an HTTP GET request to /health,
# run the function below and return whatever it returns."
# Because we included this router with prefix="/api" in main.py,
# the real path becomes /api/health.
@router.get("/health")
def health_check():
    return {"status": "ok"}
