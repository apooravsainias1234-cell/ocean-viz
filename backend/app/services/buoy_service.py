"""
Service layer for reading NDBC buoy observation data from CSV using pandas.

Your CSV has columns MM, DD, hh, mm, WTMP, ATMP, PRES, WVHT — no year column,
and no single combined timestamp column. We'll build one from the pieces,
using the current year as a placeholder (adjust if your data is historical).
"""

from pathlib import Path
from functools import lru_cache

import pandas as pd

DATA_PATH = Path("data/buoy_41002.csv")

# Fixed location for station 41002 (from NDBC's station metadata).
# Hardcoded here because your CSV doesn't include lat/lon per row —
# it's a single fixed buoy, so this is a reasonable simplification.
STATION_ID = "41002"
STATION_LATITUDE = 32.38
STATION_LONGITUDE = -75.41


@lru_cache(maxsize=1)
def _load_buoy_data_for_mtime(modified_ns: int) -> pd.DataFrame:
    return _read_buoy_data()


def load_buoy_data() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Expected buoy CSV at {DATA_PATH.resolve()}. "
            "Place your NDBC CSV there or update DATA_PATH in app/services/buoy_service.py."
        )
    return _load_buoy_data_for_mtime(DATA_PATH.stat().st_mtime_ns)


def _read_buoy_data() -> pd.DataFrame:
    """
    Load and lightly clean the buoy CSV once, then cache it.
    Same reasoning as sst_service.load_dataset(): avoid re-reading
    the file from disk on every request.
    """
    df = pd.read_csv(DATA_PATH)

    # NDBC uses 999 / 99.0 / 9999 as "missing value" placeholders in raw
    # feeds. Each column needs its OWN threshold since normal ranges differ
    # a lot: pressure (PRES) is legitimately ~950-1050 hPa, so a single
    # "> 900" check across every column was wrongly nulling real pressure
    # readings. Use per-column realistic ceilings instead.
    sentinel_thresholds = {
        "WTMP": 90,    # water temp in Celsius: nothing on Earth's oceans is > 90
        "ATMP": 90,    # air temp in Celsius: same logic
        "PRES": 1100,  # sea-level pressure in hPa: realistic max is ~1085
        "WVHT": 90,    # wave height in meters: NDBC's actual sentinel is 99
    }
    for col, threshold in sentinel_thresholds.items():
        if col in df.columns:
            df.loc[df[col] > threshold, col] = None

    return df


def get_latest_reading() -> dict:
    """
    Return the most recent row in the CSV as a dict.

    NOTE: NDBC's realtime2 feed (which download_ndbc.py pulls from) writes
    the NEWEST observation FIRST, not last — the opposite of typical
    historical CSV order. So row 0, not row -1, is "latest" here.
    """
    df = load_buoy_data()

    if df.empty:
        raise ValueError("Buoy data file is empty.")

    row = df.iloc[0]

    return _row_to_dict(row)


def get_all_readings(limit: int = 100) -> list[dict]:
    """
    Return up to `limit` most recent readings, most recent first.
    A limit exists so a request can't accidentally ask the server to
    serialize a huge file into one giant JSON response.

    Since the file is already newest-first (see note in get_latest_reading),
    we just take the first `limit` rows as-is — no reversal needed.
    """
    df = load_buoy_data()
    recent = df.head(limit)
    return [_row_to_dict(row) for _, row in recent.iterrows()]


def _row_to_dict(row: pd.Series) -> dict:
    """
    Convert one pandas row into a clean JSON-friendly dict.

    Why this helper exists: pandas NaN values don't convert to JSON
    directly (JSON has no NaN), and FastAPI would either error or produce
    invalid JSON. We convert NaN -> None, which becomes `null` in JSON —
    a legitimate way to represent "missing" in JSON.
    """
    def clean(value):
        if pd.isna(value):
            return None
        return value

    return {
        "station_id": STATION_ID,
        "latitude": STATION_LATITUDE,
        "longitude": STATION_LONGITUDE,
        "month": int(row["MM"]),
        "day": int(row["DD"]),
        "hour": int(row["hh"]),
        "minute": int(row["mm"]),
        "water_temp_c": clean(row.get("WTMP")),
        "air_temp_c": clean(row.get("ATMP")),
        "pressure_hpa": clean(row.get("PRES")),
        "wave_height_m": clean(row.get("WVHT")),
    }
