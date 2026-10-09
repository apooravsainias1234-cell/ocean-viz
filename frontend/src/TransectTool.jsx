import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { latLonToVec3 } from './buoyData.js'

const SPHERE_RADIUS = 2

// Calculates Great Circle distance between two lat/lon pairs in Kilometers and Nautical Miles
export function calculateGeodesic(lat1, lon1, lat2, lon2) {
  const R_KM = 6371.0
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const rLat1 = (lat1 * Math.PI) / 180
  const rLat2 = (lat2 * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distanceKm = R_KM * c
  const distanceNm = distanceKm * 0.539957

  // Initial compass bearing
  const y = Math.sin(dLon) * Math.cos(rLat2)
  const x =
    Math.cos(rLat1) * Math.sin(rLat2) -
    Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon)
  let bearing = (Math.atan2(y, x) * 180) / Math.PI
  bearing = (bearing + 360) % 360

  return { distanceKm, distanceNm, bearing }
}

export default function TransectTool({ pointA, pointB, onClear }) {
  const transect = useMemo(() => {
    if (!pointA || !pointB) return null

    const { distanceKm, distanceNm, bearing } = calculateGeodesic(
      pointA.latitude,
      pointA.longitude,
      pointB.latitude,
      pointB.longitude
    )

    // Generate great-circle arc points on the sphere surface
    const vA = new THREE.Vector3(...latLonToVec3(pointA.latitude, pointA.longitude, SPHERE_RADIUS + 0.025))
    const vB = new THREE.Vector3(...latLonToVec3(pointB.latitude, pointB.longitude, SPHERE_RADIUS + 0.025))

    const arcPoints = []
    const steps = 60
    for (let i = 0; i <= steps; i++) {
      const alpha = i / steps
      // Slerp along great circle
      const pt = vA.clone().lerp(vB, alpha).normalize().multiplyScalar(SPHERE_RADIUS + 0.025)
      arcPoints.push(pt)
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(arcPoints)

    // Synthetic bathymetry & temp profile samples along this transect
    const profile = Array.from({ length: 16 }, (_, i) => {
      const frac = i / 15
      const temp = pointA.tempC + (pointB.tempC - pointA.tempC) * frac + Math.sin(frac * Math.PI * 3) * 0.8
      // Deep sea depth model with continental margins
      const depth = Math.min(5200, Math.max(120, Math.sin(frac * Math.PI) * 4400 + 600))
      return { frac, temp: Number(temp.toFixed(1)), depth: Math.round(depth) }
    })

    return {
      distanceKm: Math.round(distanceKm),
      distanceNm: Math.round(distanceNm),
      bearing: Math.round(bearing),
      geometry,
      midPoint: arcPoints[Math.floor(arcPoints.length / 2)],
      profile,
    }
  }, [pointA, pointB])

  if (!transect) return null

  return (
    <group>
      {/* Geodesic path line */}
      <line geometry={transect.geometry}>
        <lineBasicMaterial color="#38bdf8" linewidth={2.5} depthWrite={false} />
      </line>

      {/* Point A Marker */}
      <mesh position={latLonToVec3(pointA.latitude, pointA.longitude, SPHERE_RADIUS + 0.03)}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>

      {/* Point B Marker */}
      <mesh position={latLonToVec3(pointB.latitude, pointB.longitude, SPHERE_RADIUS + 0.03)}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Floating HUD summary at midpoint */}
      <Html position={transect.midPoint} distanceFactor={7} style={{ pointerEvents: 'none' }}>
        <div
          className="panel transect-card"
          style={{
            padding: '10px 14px',
            fontSize: 12,
            minWidth: 260,
            transform: 'translate(-50%, -120%)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.8rem' }}>
              Ocean Transect Route
            </span>
            <button
              onClick={onClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: 2,
              }}
            >
              ✕
            </button>
          </div>

          <div className="mono" style={{ fontSize: '0.75rem', lineHeight: 1.6, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Distance:</span>
              <strong style={{ color: 'var(--accent)' }}>
                {transect.distanceNm.toLocaleString()} NM ({transect.distanceKm.toLocaleString()} km)
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Initial Bearing:</span>
              <strong>{transect.bearing}° True</strong>
            </div>
          </div>

          {/* Mini Transect Bathymetry & Temperature SVG Sparkline */}
          <div style={{ marginTop: 6, borderTop: '1px solid var(--line)', paddingTop: 6 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: 4 }}>
              Seabed Bathymetry Cross-Section:
            </div>
            <svg viewBox="0 0 200 45" width="100%" height="45" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="transectGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#082f49" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <polygon
                points={
                  '0,45 ' +
                  transect.profile.map((p, idx) => `${idx * (200 / 15)},${Math.min(42, p.depth / 130)}`).join(' ') +
                  ' 200,45'
                }
                fill="url(#transectGrad)"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-dim)', marginTop: 2 }}>
              <span>A: {pointA.tempC ?? '—'}°C</span>
              <span className="mono">Abyssal Plain ~4,500m</span>
              <span>B: {pointB.tempC ?? '—'}°C</span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  )
}
