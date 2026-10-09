import { useMemo } from 'react'
import * as THREE from 'three'
import { sampleColormap } from './colormaps.js'
import { SST_MIN, SST_MAX } from './fakeData.js'

export function buildSstImage(points, monthIndex = 0, isMhwMode = false) {
  if (points && !Array.isArray(points)) {
    points = points.data ?? points.points ?? points.grid ?? points.results ?? []
  }
  if (!Array.isArray(points) || points.length === 0) {
    throw new Error('SST grid response was empty or not in the expected shape.')
  }

  const lats = [...new Set(points.map((p) => p.latitude))].sort((a, b) => a - b)
  const lons = [...new Set(points.map((p) => p.longitude))].sort((a, b) => a - b)

  const latIndex = new Map(lats.map((lat, i) => [lat, i]))
  const lonIndex = new Map(lons.map((lon, i) => [lon, i]))

  const width = lons.length
  const height = lats.length

  const min = SST_MIN
  const range = SST_MAX - SST_MIN

  // Seasonal modulation angle: monthIndex 0=Jan, 6=July
  // In July (month 6), Northern hemisphere is warmer, Southern hemisphere cooler
  const seasonalPhase = ((monthIndex - 0) / 12) * Math.PI * 2

  const grid = new Array(width * height).fill(null)
  for (const p of points) {
    if (p.sst_celsius == null) continue
    const row = latIndex.get(p.latitude)
    const col = lonIndex.get(p.longitude)
    const flippedRow = height - 1 - row

    // Compute seasonal thermal fluctuation based on latitude
    const latRad = (p.latitude * Math.PI) / 180
    // Seasonal swing amplitude peaks at mid-to-high latitudes (~3.5 deg C), zero at equator
    const seasonalDelta = Math.sin(latRad) * Math.sin(seasonalPhase) * 3.5
    let currentTemp = p.sst_celsius + seasonalDelta

    let normalized
    if (isMhwMode) {
      // In MHW mode, show thermal anomaly above climatological baseline (~22C average)
      // Highlight positive anomalies: 0..5 deg C anomaly -> 0..1
      const anomaly = Math.max(0, currentTemp - 24.0)
      normalized = Math.min(1, anomaly / 4.5)
    } else {
      normalized = Math.min(1, Math.max(0, (currentTemp - min) / range))
    }

    grid[flippedRow * width + col] = normalized
  }

  return { grid, width, height, min, max: SST_MAX, lats, lons }
}

export function useSstTexture(sstResponse, colormapId = 'turbo', monthIndex = 0, isMhwMode = false) {
  return useMemo(() => {
    if (!sstResponse) return null

    try {
      const activeColormap = isMhwMode ? 'mhw' : colormapId
      const { grid, width, height } = buildSstImage(sstResponse, monthIndex, isMhwMode)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      const imageData = ctx.createImageData(width, height)

      for (let i = 0; i < grid.length; i++) {
        const t = grid[i]
        let r, g, b
        if (t === null) {
          // Deep ocean abyss / land silhouette neutral
          r = 4
          g = 18
          b = 27
        } else {
          ;[r, g, b] = sampleColormap(t, activeColormap)
        }
        imageData.data[i * 4 + 0] = r
        imageData.data[i * 4 + 1] = g
        imageData.data[i * 4 + 2] = b
        imageData.data[i * 4 + 3] = 255
      }

      ctx.putImageData(imageData, 0, 0)

      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.anisotropy = 8
      texture.wrapS = THREE.RepeatWrapping
      texture.needsUpdate = true
      return texture
    } catch (err) {
      console.error('Error generating SST texture:', err)
      return null
    }
  }, [sstResponse, colormapId, monthIndex, isMhwMode])
}
