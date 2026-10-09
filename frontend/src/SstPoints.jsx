import { useMemo } from 'react'
import * as THREE from 'three'
import { latLonToVec3 } from './buoyData.js'
import { tempToColor, SST_MIN, SST_MAX } from './fakeData.js'

const SPHERE_RADIUS = 2
const FIXED_MIN = SST_MIN
const FIXED_MAX = SST_MAX

// Same defensive unwrapping as useSstTexture.js, since the real backend
// wraps the grid as { count, points: [...], ... } rather than a bare array.
function unwrapPoints(sstResponse) {
  if (!sstResponse) return []
  if (Array.isArray(sstResponse)) return sstResponse
  return sstResponse.data ?? sstResponse.points ?? sstResponse.grid ?? sstResponse.results ?? []
}

// Renders every real SST grid cell as an actual visible point in 3D space,
// positioned at its true lat/lon on the sphere's surface — as opposed to
// OceanPanel's smooth painted texture, which blends cells together into a
// continuous-looking surface. This view makes the underlying grid structure
// (and its real resolution/coverage gaps) visible, closer to how a
// satellite/sensor grid actually looks before any smoothing is applied.
export default function SstPoints({ sstGrid, onPointClick }) {
  const { positions, colors, meta } = useMemo(() => {
    const points = unwrapPoints(sstGrid)
    const positions = []
    const colors = []
    const meta = [] // parallel array: meta[i] describes the point at positions[i*3..]

    for (const p of points) {
      if (p.sst_celsius == null) continue // skip land/missing cells entirely (no dot)

      const [x, y, z] = latLonToVec3(p.latitude, p.longitude, SPHERE_RADIUS + 0.02)
      positions.push(x, y, z)
      meta.push({ latitude: p.latitude, longitude: p.longitude, sst_celsius: p.sst_celsius, position: [x, y, z] })

      const normalized = Math.min(1, Math.max(0, (p.sst_celsius - FIXED_MIN) / (FIXED_MAX - FIXED_MIN)))
      const [r, g, b] = tempToColor(normalized)
      colors.push(r / 255, g / 255, b / 255)
    }

    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      meta,
    }
  }, [sstGrid])

  if (positions.length === 0) return null

  // Clicking the points cloud raycasts against every dot; Three gives us the
  // index of whichever dot was actually hit, which lines up with our meta array.
  const handleClick = (e) => {
    e.stopPropagation()
    if (e.index == null) return
    const point = meta[e.index]
    if (point && onPointClick) onPointClick(point)
  }

  return (
    <points onClick={handleClick}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      {/* vertexColors uses each point's own color (above) instead of one flat color.
          A slightly larger size makes each dot an easier click/tap target. */}
      <pointsMaterial size={0.045} vertexColors sizeAttenuation />
    </points>
  )
}
