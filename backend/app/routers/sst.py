"""
Endpoints for retrieving SST (sea surface temperature) data.
"""

from fastapi import APIRouter, HTTPException, Query

from app.services import sst_service

router = APIRouter()


@router.get("/sst/grid")
def get_sst_grid():
    """
    GET /api/sst/grid

    Returns the sampled SST grid as a flat list of {latitude, longitude,
    sst_celsius} points — useful for plotting a heatmap or map overlay,
    as opposed to /sst which only looks up a single point.

    No query parameters are needed. The service returns a four-cell sampled
    global grid (roughly 65k valid ocean points) to balance detail with a
    manageable response size for browser clients.
    """
    try:
        return sst_service.get_sst_grid()
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sst")
def get_sst(
    latitude: float = Query(..., description="Latitude in decimal degrees, e.g. 38.5"),
    longitude: float = Query(
        ...,
        description="Longitude in decimal degrees, standard -180 to 180 format "
        "(negative = West). E.g. -60 for 60W. The conversion to your file's "
        "0-360 format happens automatically.",
    ),
):
    """
    GET /api/sst?latitude=38.5&longitude=-60

    Query parameters (the ?key=value stuff after the URL) are how you pass
    input to a GET request. FastAPI reads them straight into function
    arguments because of the `Query(...)` defaults above — the "..." means
    "this parameter is required."
    """
    try:
        return sst_service.get_sst_at_point(latitude, longitude)
    except FileNotFoundError as e:
        # 500 = server-side problem (the data file isn't where it should be).
        # This isn't the user's fault, so it's a different status code
        # than the ValueError case below.
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        # 400 = client-side problem (the user asked for an out-of-range point).
        raise HTTPException(status_code=400, detail=str(e))
