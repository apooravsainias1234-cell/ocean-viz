import React, { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { OCEAN_CURRENTS } from './oceanCurrentsData.js'
import { latLonToVec3 } from './buoyData.js'

const CURRENT_RADIUS = 2.018

export default function OceanCurrents({ visible = true, speedMultiplier = 1.0, onSelectCurrent }) {
  const [selectedCurrent, setSelectedCurrent] = useState(null)
  const particlesRef = useRef([])

  // Prepare spline data for all currents
  const splineData = useMemo(() => {
    return OCEAN_CURRENTS.map((c) => {
      const v3Points = c.points.map((p) => {
        const [x, y, z] = latLonToVec3(p.lat, p.lon, CURRENT_RADIUS)
        return new THREE.Vector3(x, y, z)
      })

      // Create a smooth 3D Catmull-Rom curve over the sphere
      const curve = new THREE.CatmullRomCurve3(v3Points, false, 'centripetal', 0.5)
      const sampledPoints = curve.getPoints(80)

      // Project each sampled point precisely to the sphere surface radius
      sampledPoints.forEach((pt) => pt.normalize().multiplyScalar(CURRENT_RADIUS))

      // Generate a Tube or Line geometry
      const lineGeo = new THREE.BufferGeometry().setFromPoints(sampledPoints)

      // Create particle offsets for flow animation
      const particleCount = Math.max(8, Math.min(24, Math.floor(c.points.length * 2.5)))
      const particles = Array.from({ length: particleCount }, (_, i) => ({
        offset: i / particleCount,
      }))

      return {
        ...c,
        curve,
        sampledPoints,
        lineGeo,
        particles,
      }
    })
  }, [])

  // Animate particle flow along current curves
  useFrame((_, delta) => {
    if (!visible) return
    const speed = delta * 0.08 * speedMultiplier

    splineData.forEach((item, itemIdx) => {
      const meshGroup = particlesRef.current[itemIdx]
      if (!meshGroup) return

      item.particles.forEach((p, pIdx) => {
        p.offset = (p.offset + speed) % 1
        const pos = item.curve.getPointAt(p.offset)
        pos.normalize().multiplyScalar(CURRENT_RADIUS + 0.005)

        const child = meshGroup.children[pIdx]
        if (child) {
          child.position.copy(pos)
        }
      })
    })
  })

  if (!visible) return null

  return (
    <group>
      {splineData.map((item, idx) => {
        const isWarm = item.type === 'warm'
        const baseColor = item.color || (isWarm ? '#ff9800' : '#00e5ff')

        return (
          <group key={item.id}>
            {/* Base flow track line with soft glow */}
            <line geometry={item.lineGeo}>
              <lineBasicMaterial
                color={baseColor}
                transparent
                opacity={0.55}
                linewidth={1.5}
                depthWrite={false}
              />
            </line>

            {/* Interactive click zone for the current */}
            <mesh
              onClick={(e) => {
                e.stopPropagation()
                setSelectedCurrent(item)
                onSelectCurrent?.(item)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto'
              }}
            >
              <tubeGeometry args={[item.curve, 40, 0.02, 6, false]} />
              <meshBasicMaterial transparent opacity={0.0} depthWrite={false} />
            </mesh>

            {/* Flowing animated stream particles */}
            <group ref={(el) => (particlesRef.current[idx] = el)}>
              {item.particles.map((_, pIdx) => (
                <mesh key={pIdx}>
                  <sphereGeometry args={[0.014, 8, 8]} />
                  <meshBasicMaterial
                    color={isWarm ? '#ffe082' : '#e0f7fa'}
                    transparent
                    opacity={0.88}
                    depthWrite={false}
                  />
                </mesh>
              ))}
            </group>
          </group>
        )
      })}

      {/* Popup card when a current is clicked */}
      {selectedCurrent && (
        <Html
          position={selectedCurrent.sampledPoints[Math.floor(selectedCurrent.sampledPoints.length / 2)]}
          distanceFactor={7}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="panel current-hud-card"
            style={{
              padding: '10px 14px',
              fontSize: 12,
              minWidth: 230,
              maxWidth: 280,
              transform: 'translate(-50%, -120%)',
              pointerEvents: 'auto',
              borderLeft: `3px solid ${selectedCurrent.color}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.8rem' }}>
                {selectedCurrent.name}
              </span>
              <button
                onClick={() => setSelectedCurrent(null)}
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
            <div
              style={{
                display: 'inline-block',
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: 2,
                marginBottom: 6,
                fontWeight: 600,
                letterSpacing: '0.05em',
                background: selectedCurrent.type === 'warm' ? 'rgba(255,152,0,0.18)' : 'rgba(0,229,255,0.18)',
                color: selectedCurrent.type === 'warm' ? '#ffb74d' : '#80deea',
              }}
            >
              {selectedCurrent.type.toUpperCase()} OCEAN CURRENT
            </div>
            <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text)', lineHeight: 1.5, marginBottom: 6 }}>
              <div>Velocity: <strong style={{ color: 'var(--accent)' }}>{selectedCurrent.velocity}</strong></div>
              <div>Flow Transport: <strong>{selectedCurrent.transport}</strong></div>
            </div>
            <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
              {selectedCurrent.description}
            </p>
          </div>
        </Html>
      )}
    </group>
  )
}
