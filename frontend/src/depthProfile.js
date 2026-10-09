// ILLUSTRATIVE ONLY — the backend has no bathymetry/depth dataset, so this
// is not real measured data. It generates a plausible depth-vs-temperature
// curve using the well-known oceanographic "thermocline" shape (warm mixed
// surface layer -> rapid drop-off -> cold stable deep water), anchored to
// the real buoy's current water temperature as the surface value so it's
// at least consistent with one real number.
//
// This exists to demo how the app COULD show depth if a real dataset
// (e.g. Argo float profiles) were connected later — it must stay clearly
// labeled as illustrative so it's never mistaken for real measurements.
export function generateIllustrativeDepthProfile(surfaceTempC) {
  const surface = surfaceTempC ?? 20 // fallback if no real reading is available yet
  const deepWaterTemp = 4 // roughly realistic deep-ocean temperature worldwide
  const thermoclineDepth = 300 // meters, roughly where the steepest drop-off happens
  const maxDepth = 1000

  const steps = 40
  const profile = []

  for (let i = 0; i <= steps; i++) {
    const depth = (maxDepth / steps) * i
    // A smooth S-curve (logistic function) centered on the thermocline depth,
    // going from ~surface temp near 0m to ~deepWaterTemp by maxDepth.
    const steepness = 0.015
    const t = 1 / (1 + Math.exp(steepness * (depth - thermoclineDepth)))
    const temp = deepWaterTemp + (surface - deepWaterTemp) * t
    profile.push({ depth: Math.round(depth), temp: Math.round(temp * 10) / 10 })
  }

  return profile
}
