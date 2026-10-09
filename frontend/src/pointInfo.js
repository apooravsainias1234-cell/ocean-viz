// Builds the info shown when the user clicks any point on the globe.

import { SST_MIN, SST_MAX } from './fakeData.js'

const FIXED_MIN = SST_MIN
const FIXED_MAX = SST_MAX

function seededRandom(lat, lon) {
  const x = Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export function pointToBasinName(lat, lon) {
  if (lat > 65) return 'Arctic Ocean'
  if (lat < -55) return 'Southern Ocean'
  if (lat > 0 && lat < 30 && lon > 50 && lon < 77) return 'Arabian Sea'
  if (lat > 0 && lat < 25 && lon >= 77 && lon < 98) return 'Bay of Bengal'
  if (lon > -100 && lon < -15 && lat > 0) return 'North Atlantic Ocean'
  if (lon > -70 && lon < 20 && lat <= 0) return 'South Atlantic Ocean'
  if (lon >= 20 && lon <= 110 && lat < 30) return 'Indian Ocean'
  if (lat > 30 && lat < 45 && lon > -6 && lon < 36) return 'Mediterranean Sea'
  if ((lon > 100 || lon < -100) && lat > 0) return 'North Pacific Ocean'
  if ((lon > 110 || lon < -70) && lat <= 0) return 'South Pacific Ocean'
  return 'Pelagic World Ocean'
}

export function findNearestGridPoint(points, lat, lon) {
  if (!Array.isArray(points) || points.length === 0) return null

  let best = null
  let bestDist = Infinity
  for (const p of points) {
    if (p.sst_celsius == null) continue
    const dLat = p.latitude - lat
    let dLon = p.longitude - lon
    if (dLon > 180) dLon -= 360
    else if (dLon < -180) dLon += 360
    const dist = dLat * dLat + dLon * dLon
    if (dist < bestDist) {
      bestDist = dist
      best = p
    }
  }
  if (best && bestDist > 4) return null
  return best
}

export function buildPointInfo(lat, lon, realTempC) {
  const seed = seededRandom(lat, lon)
  const isReal = realTempC != null

  const latFactor = 1 - Math.abs(lat) / 90
  const illustrativeTemp = FIXED_MIN + (FIXED_MAX - FIXED_MIN) * latFactor * (0.7 + seed * 0.3)
  const tempC = isReal ? realTempC : Math.round(illustrativeTemp * 10) / 10

  const depthM = Math.round(200 + seed * 3800)
  const waveM = Math.round((0.3 + (1 - latFactor) * 1.8 + seed * 1.2) * 10) / 10
  const salinityPsu = Math.round((33 + seed * 4) * 10) / 10

  return {
    latitude: lat,
    longitude: lon,
    tempC,
    isTempReal: isReal,
    depthM,
    waveM,
    salinityPsu,
  }
}
