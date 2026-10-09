// Professional scientific oceanographic colormaps:
// 1. turbo   - High-contrast, perceptually balanced multi-hue spectrum (Google DeepMind standard)
// 2. thermal - Radiative thermal emission (Black -> Purple -> Crimson -> Orange -> Yellow -> White)
// 3. noaa    - Classic NOAA Coral Reef Watch / OISST ramp (Navy -> Cyan -> Yellow -> Dark Red)
// 4. viridis - Colorblind accessible, monotonically increasing luminance
// 5. abyss   - Marine deep-ocean aesthetic (Deep Navy -> Azure -> Bioluminescent Cyan -> Seafoam)

export const COLORMAPS = {
  turbo: {
    id: 'turbo',
    name: 'Turbo Spectral',
    description: 'High dynamic range scientific colormap',
    stops: [
      { t: 0.00, c: [48, 18, 59] },
      { t: 0.15, c: [70, 134, 251] },
      { t: 0.35, c: [27, 229, 181] },
      { t: 0.55, c: [164, 252, 60] },
      { t: 0.75, c: [251, 185, 56] },
      { t: 0.90, c: [227, 68, 10] },
      { t: 1.00, c: [122, 4, 3] },
    ],
  },
  thermal: {
    id: 'thermal',
    name: 'Thermal Heat',
    description: 'Radiative sea-surface heat signature',
    stops: [
      { t: 0.00, c: [10, 8, 28] },
      { t: 0.20, c: [60, 15, 110] },
      { t: 0.40, c: [140, 25, 120] },
      { t: 0.60, c: [220, 70, 60] },
      { t: 0.80, c: [255, 170, 30] },
      { t: 1.00, c: [255, 255, 180] },
    ],
  },
  noaa: {
    id: 'noaa',
    name: 'NOAA Classic',
    description: 'Standard NOAA OISST ocean temperature scale',
    stops: [
      { t: 0.00, c: [21, 42, 130] },
      { t: 0.30, c: [0, 170, 200] },
      { t: 0.55, c: [255, 221, 87] },
      { t: 0.80, c: [230, 80, 40] },
      { t: 1.00, c: [180, 20, 20] },
    ],
  },
  viridis: {
    id: 'viridis',
    name: 'Viridis',
    description: 'Perceptually uniform & colorblind accessible',
    stops: [
      { t: 0.00, c: [68, 1, 84] },
      { t: 0.25, c: [59, 82, 139] },
      { t: 0.50, c: [33, 145, 140] },
      { t: 0.75, c: [94, 201, 98] },
      { t: 1.00, c: [253, 231, 37] },
    ],
  },
  abyss: {
    id: 'abyss',
    name: 'Oceanic Abyss',
    description: 'Deep marine to bioluminescent turquoise',
    stops: [
      { t: 0.00, c: [3, 15, 38] },
      { t: 0.25, c: [8, 48, 88] },
      { t: 0.50, c: [18, 105, 145] },
      { t: 0.75, c: [34, 180, 195] },
      { t: 1.00, c: [142, 245, 230] },
    ],
  },
  mhw: {
    id: 'mhw',
    name: 'MHW Anomaly',
    description: 'Marine Heatwave thermal anomaly scale (+0°C to +5°C)',
    stops: [
      { t: 0.00, c: [30, 60, 90] },    // Baseline (normal ocean)
      { t: 0.25, c: [250, 218, 94] },  // Cat I Moderate (+1.5C)
      { t: 0.50, c: [243, 114, 44] },  // Cat II Strong (+2.5C)
      { t: 0.75, c: [220, 40, 40] },   // Cat III Severe (+3.5C)
      { t: 1.00, c: [150, 0, 120] },   // Cat IV Extreme (+5C)
    ],
  },
}

export function sampleColormap(t, colormapId = 'turbo') {
  const cmap = COLORMAPS[colormapId] || COLORMAPS.turbo
  const stops = cmap.stops
  const clamped = Math.max(0, Math.min(1, t))

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (clamped >= a.t && clamped <= b.t) {
      const localT = (clamped - a.t) / (b.t - a.t)
      return [
        Math.round(a.c[0] + (b.c[0] - a.c[0]) * localT),
        Math.round(a.c[1] + (b.c[1] - a.c[1]) * localT),
        Math.round(a.c[2] + (b.c[2] - a.c[2]) * localT),
      ]
    }
  }
  return stops[stops.length - 1].c
}

export function getColormapCssGradient(colormapId = 'turbo') {
  const cmap = COLORMAPS[colormapId] || COLORMAPS.turbo
  const parts = cmap.stops.map((s) => `rgb(${s.c[0]}, ${s.c[1]}, ${s.c[2]}) ${Math.round(s.t * 100)}%`)
  return `linear-gradient(to right, ${parts.join(', ')})`
}
