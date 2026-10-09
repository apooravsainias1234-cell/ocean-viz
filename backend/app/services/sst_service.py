"""
Service layer for reading SST (sea surface temperature) data from the
OISST NetCDF file using xarray.

Kept separate from the router (app/routers/sst.py) so the "how do I read
this file" logic is independent from "how do I expose this over HTTP".
"""

from pathlib import Path
from functools import lru_cache

import xarray as xr

# Now pointing at the full-globe file instead of the North Atlantic sample.
DATA_PATH = Path("data/oisst_global.nc")

# Full globe at 0.25 deg resolution is ~720 x 1440 = ~1,000,000 points.
# We downsample by taking every Nth point in each dimension before sending
# JSON, so the response stays a reasonable size for a browser/React app.
# Every 4th point in both lat and lon -> ~180 x 360 = ~64,800 points max.
# This gives the globe four times the spatial detail of step 8 while keeping
# the JSON payload far below the ~1 million point full-resolution source.
DOWNSAMPLE_STEP = 4


@lru_cache(maxsize=1)
def _load_dataset_for_mtime(modified_ns: int) -> xr.Dataset:
    # The mtime is part of the cache key. When a local refresh job replaces
    # the NOAA file, the next API request loads the new snapshot automatically.
    return xr.open_dataset(DATA_PATH)


def load_dataset() -> xr.Dataset:
    """Load the current NetCDF snapshot, reusing it until the file changes."""
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Expected NetCDF file at {DATA_PATH.resolve()}. "
            "Place your OISST file there or update DATA_PATH in app/services/sst_service.py."
        )
    return _load_dataset_for_mtime(DATA_PATH.stat().st_mtime_ns)


def lon_to_360(longitude: float) -> float:
    """
    Convert a "normal" longitude (-180 to 180, where negative = West)
    into the 0-360 format your OISST file uses.
    """
    return longitude % 360


def get_sst_grid() -> dict:
    """
    Return a DOWNSAMPLED SST grid as flat lists, ready for a frontend to plot.

    Full-globe data has ~1 million grid points per day — far too many to
    send as JSON in one response. We take every Nth point (DOWNSAMPLE_STEP)
    in both latitude and longitude, which keeps visual coverage of the
    whole globe while keeping the response small and fast to transfer/render.
    """
    ds = load_dataset()

    # .squeeze() drops the size-1 dimensions (time:1, zlev:1).
    sst = ds["sst"].squeeze()

    # Downsample by slicing every Nth index in each spatial dimension.
    sst_downsampled = sst.isel(
        latitude=slice(None, None, DOWNSAMPLE_STEP),
        longitude=slice(None, None, DOWNSAMPLE_STEP),
    )

    df = sst_downsampled.to_dataframe().reset_index()
    df = df.dropna(subset=["sst"])

    # Convert longitude back to -180/180 format for the frontend.
    df["longitude"] = df["longitude"].apply(lambda lon: lon - 360 if lon > 180 else lon)

    points = [
        {
            "latitude": round(float(row.latitude), 3),
            "longitude": round(float(row.longitude), 3),
            "sst_celsius": round(float(row.sst), 3),
        }
        for row in df.itertuples()
    ]

    return {
        "count": len(points),
        "downsample_step": DOWNSAMPLE_STEP,
        "source_date": str(ds["time"].max().values)[:10] if "time" in ds.coords else None,
        "latitude_range": [float(ds.latitude.min()), float(ds.latitude.max())],
        "longitude_range_deg_e_w": [-180.0, 180.0],
        "points": points,
    }


def get_sst_at_point(latitude: float, longitude: float) -> dict:
    """
    Look up the SST value nearest to the given latitude/longitude.
    Uses the FULL-RESOLUTION dataset (not downsampled) since this is a
    single lookup, not a bulk response — precision matters here and
    there's no size concern for one point.
    """
    ds = load_dataset()

    lon_360 = lon_to_360(longitude)

    lat_min, lat_max = float(ds.latitude.min()), float(ds.latitude.max())
    lon_min, lon_max = float(ds.longitude.min()), float(ds.longitude.max())

    if not (lat_min <= latitude <= lat_max):
        raise ValueError(
            f"latitude {latitude} is outside the data's coverage ({lat_min} to {lat_max})"
        )
    if not (lon_min <= lon_360 <= lon_max):
        raise ValueError(
            f"longitude {longitude} (converted to {lon_360} in 0-360 format) "
            f"is outside the data's coverage ({lon_min} to {lon_max})"
        )

    point = ds["sst"].sel(latitude=latitude, longitude=lon_360, method="nearest")
    sst_value = point.item()

    return {
        "requested_latitude": latitude,
        "requested_longitude": longitude,
        "matched_latitude": float(point.latitude.item()),
        "matched_longitude": float(point.longitude.item()),
        "sst_celsius": round(sst_value, 3) if sst_value is not None else None,
    }
