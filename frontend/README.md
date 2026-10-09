# Ocean Viz — Step 1.8 (bug fixes, phone/deploy support, small additions)

A pass focused on things that were quietly broken or missing rather than new
view modes: a real LAN-access bug, a coordinate-math bug, a mobile layout
overlap, and a couple of small additions (reset view, keyboard dismiss).

## Fixes
- **Phone/deployed access was broken.** `src/api.js` hardcoded
  `http://localhost:8000`. Opening the app from your phone via the printed
  `Network:` URL worked fine (thanks to `vite.config.js`'s `host: true`), but
  every API call still failed, because `localhost` on your phone means *your
  phone*, not your dev machine. `api.js` now resolves the backend URL as: an
  optional `VITE_API_BASE_URL` env var (see `.env.example`, for a real
  separate-domain deployment) &rarr; same-hostname-port-8000 if the page
  itself was opened via a LAN IP &rarr; `http://localhost:8000` otherwise.
  Also added a request timeout (10s for GETs, 20s for the AI prediction POST)
  so a backend that's simply not running fails fast with a clear message
  instead of hanging on "Loading ocean data...". The loading/error screens
  now show the actual resolved address instead of a hardcoded string.
- **Antimeridian bug in `src/pointInfo.js`.** `findNearestGridPoint` compared
  longitudes with plain subtraction, so a click near lon &plusmn;180&deg;
  could think a point 358&deg; away (e.g. 179&deg; vs. -179&deg;, actually 2&deg;
  apart) was closer than the real nearest cell. Longitude deltas are now
  wrapped into [-180, 180] first.
- **Mobile overlap.** Legend (bottom-center), DepthPanel (bottom-left), and
  GpsPanel (bottom-right) all sat in the same `bottom: 16px` band and
  visibly collided under ~480px wide - DepthPanel and GpsPanel alone fit
  that band fine at any phone width, so the Legend now gets its own band
  above them at that breakpoint (`src/index.css`).
- **Depth chart overflow.** `DepthPanel`'s SVG had a hardcoded 220px width,
  which could overflow its container on narrow screens. It now scales via
  `viewBox` instead.
- Minor: the SST canvas texture now sets `wrapS = RepeatWrapping` (matching
  the day-map texture) so bilinear filtering blends across the lon
  180/-180 seam instead of clamping to the edge pixel.

## Additions
- **Reset view** — a small icon button next to the view-mode buttons flies
  the camera back to its exact starting framing (lat 0, lon -90, distance 6),
  so orbiting/zooming around doesn't strand you without a quick way back.
- **Escape to dismiss** the clicked-point popup, in addition to its existing
  &times; button.
- Small accessibility passes: `aria-pressed` on the view-mode buttons,
  `role="group"` + `aria-label` on the group, a proper favicon and meta
  description in `index.html`.
- Removed a `console.log` diagnostic in `App.jsx` that was only useful while
  first figuring out the SST grid response shape (see Step 1.4 below) - that
  shape's been stable and well-handled since.

---

# Ocean Viz — Step 1.7 (click anywhere on the globe for info)

**Note:** the SST grid is now full-globe (not just the North Atlantic patch
described lower in this file) and there's just one real buoy — see
`src/pointInfo.js` and the "Step 1.7" section below for what's current.

## Step 1.7: click/tap anywhere on the globe
- `src/pointInfo.js` — given a lat/lon (and a real temp if we have one),
  builds the popup payload: real `sst_celsius` when the click lands near a
  real grid cell, otherwise a plausible latitude-based fallback; depth, wave
  height, and salinity are always illustrative (the backend has none of
  that data), and are clearly labeled "(illustrative)" in the popup.
- `src/PointInfoPopup.jsx` — the popup shown at the clicked point, styled to
  match `BuoyMarker`'s existing popup, with a close (✕) button.
- `src/OceanPanel.jsx` — clicking the sphere raycasts to get the exact 3D hit
  point, converts it back to lat/lon, looks up the nearest real grid cell
  (within ~2° — otherwise treated as no real coverage there), and shows the
  popup. Works in both "Surface" (texture) and "Grid points" view modes.
- `src/SstPoints.jsx` — dots are now individually clickable (uses each real
  point's exact data, no lookup needed) and slightly bigger for easier
  tapping.

### Try it
Click/tap any spot on the globe in either view mode — a marker and popup
appear with temperature (real where available), plus illustrative depth,
wave height, and salinity. Click the ✕ to dismiss, or click elsewhere to
move the popup to the new spot.

---

# Ocean Viz — Step 1.4 (connected to real backend)

## Before you run this
You need Person B's backend running first, at `http://localhost:8000` (the base URL
in `src/api.js`). Ask them for the exact start command. Then confirm it's up by
opening `http://localhost:8000/api/health` in your browser — you should see
`{"status": "ok"}`.

## What's in here
- `src/api.js` — the functions that call the real backend: `fetchSstGrid()`,
  `fetchBuoyLatest()`, `fetchBuoyHistory()`, `checkHealth()`.
- `src/App.jsx` — fetches the SST grid and buoy history once on load, shows a
  loading message while waiting, and a friendly error message (with troubleshooting
  tips) if the backend isn't reachable.
- `src/OceanPanel.jsx` — replaces the old full-sphere heatmap. The real data only
  covers one ocean patch (lat 30-50°N, lon -70 to -40°W), so instead of wrapping
  fake data around the whole globe, this renders a curved panel that follows the
  sphere's surface but only over that real coverage area — a plain dark sphere sits
  underneath so it still reads as "a globe," just with real data only where real
  data exists.
- `src/useSstTexture.js` — the real `/api/sst/grid` response is a flat list of
  `{ latitude, longitude, sst_celsius }` points, not a ready-made 2D grid. This file
  figures out the grid's actual width/height from the unique lat/lon values, buckets
  each point into its row/column, and paints it onto a canvas texture. Cells with
  `sst_celsius: null` (e.g. over land) are drawn dark gray instead of a misleading color.
- `src/BuoyMarker.jsx` — now shows the one real buoy station (41002) with its water
  temp, air temp, pressure, and wave height. Any `null` field displays as "—" instead
  of crashing, per the API doc's null-handling note.
- `src/ControlPanel.jsx` — the Temperature/Salinity dropdown is gone (the backend
  only serves temperature). The slider now scrubs through real buoy history readings
  (most recent → oldest), since there's no fake 10-day timeline anymore.
- `src/fakeData.js` — trimmed down to just `tempToColor()`, the color-scale function,
  which is still used to color both the real SST data and the legend.
- `src/buoyData.js` — trimmed down to just `latLonToVec3()`, the lat/lon-to-3D-position
  math, still used by both the SST panel and the buoy marker.
- `src/Legend.jsx`, `src/Scene.jsx`, `src/main.jsx`, `index.html`, `vite.config.js`,
  `package.json` — unchanged from Step 1.3.

## What changed from the fake-data version (Step 1.3)
- Full-globe fake heatmap → a real-data patch over its actual lat/lon coverage.
- 12 fake buoys → 1 real buoy station, since that's what the backend provides.
- Temperature/Salinity dropdown → removed (backend has no salinity endpoint).
- Fake 1-10 day slider → real "scrub through past buoy readings" slider.
- Added loading and error states so the app doesn't break if the backend isn't
  running yet or a request fails.

## Exact terminal commands (macOS)

```bash
cd ocean-viz
npm install
npm run dev
```

Vite will print a local URL, usually `http://localhost:5173/`. Open that in your browser.

## You should see
First, a brief "Loading ocean data…" message. Then: a dark scene with stars, a
sphere with a colored patch (blue→red) covering roughly the North Atlantic, and one
white/yellow dot (the real buoy) on that patch. Hover or tap the dot for real water
temp, air temp, pressure, and wave height. Top-right, a slider lets you scrub back
through the buoy's recent reading history. If the backend isn't running, you'll see
a clear error message instead of a blank screen or crash.

## Quick Overview
I connected the app to Person B's real FastAPI backend: `api.js` fetches the SST
grid and buoy history on load, `useSstTexture.js` turns the flat grid response into
a texture (handling `null`/land cells), `OceanPanel.jsx` renders that as a
real-coverage patch instead of a misleading full-globe fake heatmap, and
`BuoyMarker.jsx`/`ControlPanel.jsx` now show the one real station and let you scrub
through its actual history. Test it by starting the backend first, then
`npm run dev` — you should see real NOAA-derived temperatures and the real buoy
location. Try your phone too, using the printed Network URL (note: your phone will
need to reach the backend's address too, not just localhost — ask Person C about
this for the deployed version).
