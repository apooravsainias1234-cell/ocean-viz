import React, { useState } from 'react'
import { Html } from '@react-three/drei'
import { SEABED_FEATURES } from './trenchesData.js'
import { latLonToVec3 } from './buoyData.js'

const FEATURE_RADIUS = 2.015

export default function SeabedFeatures({ visible = true, onSelectFeature }) {
  const [selectedFeature, setSelectedFeature] = useState(null)

  if (!visible) return null

  return (
    <group>
      {SEABED_FEATURES.map((feature) => {
        const [x, y, z] = latLonToVec3(feature.lat, feature.lon, FEATURE_RADIUS)
        const isSelected = selectedFeature?.id === feature.id

        return (
          <group key={feature.id} position={[x, y, z]}>
            {/* Holographic diamond/rhombus marker for deep seabed features */}
            <mesh
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFeature(feature)
                onSelectFeature?.(feature)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto'
              }}
            >
              <octahedronGeometry args={[0.038, 0]} />
              <meshStandardMaterial
                color={feature.color}
                emissive={feature.color}
                emissiveIntensity={isSelected ? 1.0 : 0.6}
                roughness={0.2}
              />
            </mesh>

            {/* Depth indicator beam pointing slightly inward */}
            <mesh position={[0, -0.015, 0]}>
              <cylinderGeometry args={[0.003, 0.003, 0.03, 8]} />
              <meshBasicMaterial color={feature.color} transparent opacity={0.6} />
            </mesh>

            {isSelected && (
              <Html distanceFactor={7} style={{ pointerEvents: 'none' }}>
                <div
                  className="panel trench-hud-card"
                  style={{
                    padding: '10px 14px',
                    fontSize: 12,
                    minWidth: 240,
                    maxWidth: 290,
                    transform: 'translate(-50%, -125%)',
                    pointerEvents: 'auto',
                    borderLeft: `3px solid ${feature.color}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.8rem' }}>
                      {feature.name}
                    </span>
                    <button
                      onClick={() => setSelectedFeature(null)}
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
                      fontSize: '0.62rem',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      padding: '2px 5px',
                      borderRadius: 2,
                      background: 'rgba(168, 85, 247, 0.2)',
                      color: '#d8b4fe',
                      marginBottom: 6,
                    }}
                  >
                    BATHYMETRIC FEATURE &middot; {feature.ocean}
                  </div>
                  <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text)', lineHeight: 1.5, marginBottom: 6 }}>
                    <div>Seafloor Depth: <strong style={{ color: 'var(--accent)' }}>-{feature.depth_m.toLocaleString()} m</strong></div>
                    <div>Hydrostatic Pressure: <strong>{feature.pressure_atm} atm</strong></div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                    {feature.description}
                  </p>
                </div>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}
