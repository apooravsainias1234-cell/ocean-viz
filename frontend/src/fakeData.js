// Fixed, physically realistic SST range (-2C to 32C) used to normalize every
// temperature -> color mapping in the app (texture, grid points, and the
// legend). Shared here so all three always agree on what "0" and "1" mean —
// see useSstTexture.js for the reasoning on why this is fixed instead of
// derived from whatever min/max happens to be in a given dataset.
export const SST_MIN = -2
export const SST_MAX = 32

// Maps a 0..1 value to an [r, g, b] color, blue (cold) -> cyan -> yellow -> red (hot).
// Used to color both the real SST data and the legend gradient.
export function tempToColor(t) {
  const stops = [
    { t: 0.0, c: [21, 42, 130] },   // deep blue (cold)
    { t: 0.35, c: [0, 170, 200] },  // cyan
    { t: 0.6, c: [255, 221, 87] },  // yellow
    { t: 1.0, c: [200, 30, 30] },   // red (hot)
  ]

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (t >= a.t && t <= b.t) {
      const localT = (t - a.t) / (b.t - a.t)
      return [
        Math.round(a.c[0] + (b.c[0] - a.c[0]) * localT),
        Math.round(a.c[1] + (b.c[1] - a.c[1]) * localT),
        Math.round(a.c[2] + (b.c[2] - a.c[2]) * localT),
      ]
    }
  }
  return stops[stops.length - 1].c
}
