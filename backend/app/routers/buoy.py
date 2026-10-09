"""
Endpoints for retrieving NDBC buoy observation data.
"""

from fastapi import APIRouter, HTTPException, Query

from app.services import buoy_service

router = APIRouter()


@router.get("/buoy/latest")
def get_latest_buoy_reading():
    """
    GET /api/buoy/latest

    Returns the single most recent observation from the buoy CSV.
    """
    try:
        return buoy_service.get_latest_reading()
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/buoy/history")
def get_buoy_history(
    limit: int = Query(
        100,
        ge=1,
        le=1000,
        description="Max number of most-recent readings to return (1-1000).",
    ),
):
    """
    GET /api/buoy/history?limit=50

    Returns up to `limit` recent observations, most recent first.
    `ge=1, le=1000` on the Query means FastAPI validates this for you —
    if someone passes limit=0 or limit=99999, they get a clean 422 error
    automatically, before your function even runs.
    """
    try:
        return buoy_service.get_all_readings(limit=limit)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
