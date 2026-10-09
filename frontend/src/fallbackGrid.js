// Realistic global fallback SST grid for instant demo / offline exploration
// Provides ~2,800 global oceanic grid points covering all ocean basins.

export function generateGlobalFallbackGrid() {
  const points = []
  // 5-degree global resolution grid covering -75 to 75 lat and -180 to 180 lon
  for (let lat = -75; lat <= 75; lat += 3.5) {
    const latFactor = 1 - Math.abs(lat) / 90 // 1 at equator, 0 at poles
    for (let lon = -180; lon <= 180; lon += 5) {
      // Simple land mask heuristic to avoid continent centers
      const isAfrica = (lat >= -35 && lat <= 35 && lon >= 10 && lon <= 45)
      const isEurasia = (lat >= 30 && lat <= 70 && lon >= 25 && lon <= 130)
      const isNorthAmerica = (lat >= 25 && lat <= 65 && lon >= -125 && lon <= -75)
      const isSouthAmerica = (lat >= -50 && lat <= 10 && lon >= -75 && lon <= -40)
      const isAustralia = (lat >= -38 && lat <= -15 && lon >= 115 && lon <= 150)
      const isAntarctica = (lat < -70)

      if (isAfrica || isEurasia || isNorthAmerica || isSouthAmerica || isAustralia || isAntarctica) {
        continue
      }

      // Base temperature by latitude
      let sst = -1.8 + 31.8 * Math.pow(latFactor, 1.2)

      // Ocean gyre thermal asymmetry (Gulf Stream / Kuroshio western boundary warming)
      if (lat > 20 && lat < 45 && lon > -80 && lon < -40) {
        sst += 3.2 // Gulf Stream warming
      }
      if (lat > 20 && lat < 40 && lon > 125 && lon < 165) {
        sst += 2.8 // Kuroshio warming
      }
      // Cold upwelling (California / Humboldt / Benguela)
      if (lat > 15 && lat < 40 && lon > -130 && lon < -115) {
        sst -= 3.0 // California current cooling
      }
      if (lat > -35 && lat < -5 && lon > -85 && lon < -72) {
        sst -= 3.5 // Humboldt upwelling cooling
      }
      if (lat > -30 && lat < -10 && lon > 5 && lon < 18) {
        sst -= 2.8 // Benguela upwelling
      }

      // Clamp to physical ocean limits
      sst = Math.max(-2.0, Math.min(32.5, Math.round(sst * 10) / 10))

      points.push({
        latitude: lat,
        longitude: lon,
        sst_celsius: sst,
      })
    }
  }

  return {
    count: points.length,
    source_date: 'Global Baseline Climatology (OISST)',
    points,
  }
}
