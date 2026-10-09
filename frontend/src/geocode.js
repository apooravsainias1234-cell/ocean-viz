// Resolves a free-text search query (typed or spoken) into a lat/lon the
// camera can fly to. Two sources, checked in order:
//
//   1. The buoy station(s) this project already knows about (buoyData.js /
//      the single real NDBC station used elsewhere in the app). Checked
//      first and matched loosely (id or name) so typing "buoy" or "41002"
//      just works without a network call.
//   2. OpenStreetMap's Nominatim API — a free, keyless geocoding service —
//      for anything else ("Tokyo", "Bay of Bengal", "Great Barrier Reef").
//
// Nominatim's usage policy asks for a descriptive User-Agent and no more
// than ~1 request/second, which is well within what a search box needs.
// See https://operations.osmfoundation.org/policies/nominatim/

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

// The one real buoy this prototype tracks. If a teammate adds more buoys
// later, add them to this array and search will pick them up automatically.
const KNOWN_BUOYS = [
  { id: '41002', name: 'NDBC Buoy 41002', latitude: 32.3, longitude: -75.4 },
]

function matchKnownBuoy(query) {
  const q = query.trim().toLowerCase()
  if (!q) return null
  return (
    KNOWN_BUOYS.find(
      (b) => b.id.toLowerCase() === q || b.name.toLowerCase().includes(q) || q.includes(b.id.toLowerCase())
    ) ?? null
  )
}

async function searchNominatim(query) {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`
  const res = await fetch(url, {
    headers: {
      // Nominatim asks for an identifying User-Agent/Referer; browsers set
      // Referer automatically, and most browsers block manually setting
      // User-Agent from JS, so this header is best-effort documentation.
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`Place search failed: ${res.status} ${res.statusText}`)
  }
  const results = await res.json()
  if (!Array.isArray(results) || results.length === 0) return null
  const top = results[0]
  return {
    kind: 'place',
    name: top.display_name,
    latitude: parseFloat(top.lat),
    longitude: parseFloat(top.lon),
  }
}

// Main entry point used by SearchBar.jsx. Returns:
//   { kind: 'buoy' | 'place', name, latitude, longitude }
// or null if nothing was found. Throws only on network/HTTP failure (not on
// "no results", which resolves to null so the UI can show "not found").
export async function searchLocation(query) {
  if (!query || !query.trim()) return null

  const buoy = matchKnownBuoy(query)
  if (buoy) {
    return { kind: 'buoy', name: buoy.name, latitude: buoy.latitude, longitude: buoy.longitude }
  }

  return searchNominatim(query)
}
