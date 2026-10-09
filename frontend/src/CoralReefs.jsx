import React, { useState } from 'react'
import { Html } from '@react-three/drei'
import { CORAL_REEFS } from './coralReefsData.js'
import { latLonToVec3 } from './buoyData.js'

const REEF_RADIUS = 2.016

export default function CoralReefs({ visible = true, onSelectReef }) {
  const [selectedReef, setSelectedReef] = useState(null)

  if (!visible) return null

  return (
    <group>
      {CORAL_REEFS.map((reef) => {
        const [x, y, z] = latLonToVec3(reef.lat, reef.lon, REEF_RADIUS)
        const isSelected = selectedReef?.id === reef.id

        return (
          <group key={reef.id} position={[x, y, z]}>
            {/* Glowing coral biological icon */}
            <mesh
              onClick={(e) => {
                e.stopPropagation()
                setSelectedReef(reef)
                onSelectReef?.(reef)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto'
              }}
            >
              <icosahedronGeometry args={[0.034, 0]} />
              <meshStandardMaterial
                color={reef.alert_color}
                emissive={reef.alert_color}
                emissiveIntensity={isSelected ? 1.0 : 0.6}
                roughness={0.2}
              />
            </mesh>

            {/* Bleaching Alert Pulse Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.045, 0.058, 20]} />
              <meshBasicMaterial color={reef.alert_color} transparent opacity={0.45} depthWrite={false} />
            </mesh>

            {isSelected && (
              <Html distanceFactor={7} style={{ pointerEvents: 'none' }}>
                <div
                  className="panel reef-hud-card"
                  style={{
                    padding: '10px 14px',
                    fontSize: 12,
                    minWidth: 250,
                    maxWidth: 300,
                    transform: 'translate(-50%, -125%)',
                    pointerEvents: 'auto',
                    borderLeft: `3px solid ${reef.alert_color}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.8rem' }}>
                      🐠 {reef.name}
                    </span>
                    <button
                      onClick={() => setSelectedReef(null)}
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
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '2px 6px',
                      borderRadius: 2,
                      background: 'rgba(245, 158, 11, 0.18)',
                      color: reef.alert_color,
                      marginBottom: 6,
                    }}
                  >
                    NOAA CRW: {reef.alert_level}
                  </div>

                  <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text)', lineHeight: 1.55, marginBottom: 6 }}>
                    <div>Degree Heating Weeks: <strong style={{ color: reef.alert_color }}>{reef.dhw_degree_heating_weeks} °C-weeks</strong></div>
                    <div>Thermal Status: <strong>{reef.status}</strong></div>
                    <div>Biodiversity: <span style={{ color: 'var(--text-dim)' }}>{reef.species_count}</span></div>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                    {reef.description}
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
