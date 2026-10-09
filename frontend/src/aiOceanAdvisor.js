// Dual-Engine Ocean Condition Advisor & Climate Intelligence.
// Integrates with backend Groq API when reachable, and provides an expert
// on-board oceanographic heuristic synthesis engine for offline/fallback resilience.

import { predictConditions } from './api.js'

export async function getOceanPrediction(info) {
  try {
    const result = await predictConditions(info)
    return {
      prediction: result.prediction,
      source: 'Groq LLM (Cloud)',
    }
  } catch (err) {
    // If backend isn't reachable or GROQ_API_KEY isn't set, synthesize locally
    const synthesized = generateLocalOceanSynthesis(info)
    return {
      prediction: synthesized,
      source: 'On-Board Oceanographic Engine',
    }
  }
}

function generateLocalOceanSynthesis(info) {
  const { latitude, longitude, tempC, depthM, waveM, salinityPsu } = info

  // 1. Identify regional ocean basin
  let basin = 'open pelagic ocean'
  let currentNote = ''
  let cyclogenesisRisk = false

  if (latitude > 20 && latitude < 50 && longitude > -80 && longitude < -30) {
    basin = 'North Atlantic Gulf Stream system'
    currentNote = 'Strong thermal boundary layer associated with the poleward Gulf Stream conveyor.'
  } else if (latitude >= -15 && latitude <= 25 && longitude >= 50 && longitude <= 95) {
    basin = latitude > 5 ? (longitude < 78 ? 'Arabian Sea monsoon upwelling basin' : 'Bay of Bengal tropical marine basin') : 'Equatorial Indian Ocean'
    currentNote = 'Seasonal monsoonal wind-stress modulates regional mixed layer dynamics and chlorophyll-a concentrations.'
  } else if (Math.abs(latitude) < 15 && (longitude < -90 || longitude > 140)) {
    basin = 'Equatorial Pacific ENSO monitoring corridor'
    currentNote = 'Sensitive to Kelvin wave propagation and Walker circulation thermocline displacement.'
  } else if (latitude < -45) {
    basin = 'Southern Ocean Antarctic Circumpolar Current'
    currentNote = 'Intense westerly wind forcing with deep vertical convection and high dissolved oxygen content.'
  } else if (latitude > 65) {
    basin = 'Arctic sub-polar marginal sea'
    currentNote = 'Near-freezing surface layers stabilized by low salinity sea-ice melt runoff.'
  }

  // Cyclogenesis threshold: SST >= 26.5°C in tropical latitudes (5° - 30°)
  if (tempC >= 26.5 && Math.abs(latitude) >= 5 && Math.abs(latitude) <= 30) {
    cyclogenesisRisk = true
  }

  // Thermal anomaly assessment
  let thermalStatus = 'normal seasonal parameters'
  if (tempC > 28.5) {
    thermalStatus = 'elevated surface heat accumulation (Category II Marine Heatwave risk)'
  } else if (tempC < 4.0) {
    thermalStatus = 'deep sub-polar chilling'
  }

  // Narrative synthesis
  const parts = [
    `Located within the ${basin}, this profile displays a sea-surface temperature of ${tempC.toFixed(1)}°C, reflecting ${thermalStatus}.`,
  ]

  if (currentNote) {
    parts.push(currentNote)
  }

  if (cyclogenesisRisk) {
    parts.push(`With thermal energy exceeding the 26.5°C threshold, atmospheric boundary conditions favor potential convective cyclogenesis during favorable low wind-shear windows.`)
  } else if (waveM && waveM > 3.0) {
    parts.push(`Surface seas are energetic with swell heights averaging ~${waveM}m, indicative of persistent open-ocean fetch.`)
  } else {
    parts.push(`Stable upper-ocean stratification suggests a well-defined pycnocline with calm to moderate sea-state stability.`)
  }

  return parts.join(' ')
}
