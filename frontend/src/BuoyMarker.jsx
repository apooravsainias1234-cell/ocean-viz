import React, { useState } from 'react'
import { Html } from '@react-three/drei'
import { latLonToVec3 } from './buoyData.js'
import { GLOBAL_BUOYS } from './buoyFleetData.js'

const SPHERE_RADIUS = 2

function fmt(value, unit) {
  return value == null ? '—' : `${value} ${unit}`
}

export default function BuoyMarker({ reading, activeBuoyId, onSelectBuoy }) {
  const [hoveredStation, setHoveredStation] = useState(null)
  const [clickedStation, setClickedStation] = useState(null)

  // Merge the primary live reading (Station 41002) if provided from the backend
  const buoyList = GLOBAL_BUOYS.map((b) => {
    if (b.station_id === '41002' && reading) {
      return {
        ...b,
        water_temp_c: reading.water_temp_c ?? b.water_temp_c,
        air_temp_c: reading.air_temp_c ?? b.air_temp_c,
        wave_height_m: reading.wave_height_m ?? b.wave_height_m,
        pressure_hpa: reading.pressure_hpa ?? b.pressure_hpa,
      }
    }
    return b
  })

  return (
    <group>
      {buoyList.map((buoy) => {
        const isHovered = hoveredStation === buoy.station_id
        const isClicked = (clickedStation === buoy.station_id) || (activeBuoyId === buoy.station_id)
        const showPopup = isHovered || isClicked
        const position = latLonToVec3(buoy.latitude, buoy.longitude, SPHERE_RADIUS + 0.032)
        const isFloat = buoy.isFloat

        const markerColor = isFloat ? '#00e5ff' : buoy.isPrimary ? '#ffb648' : '#34d399'

        return (
          <group key={buoy.station_id} position={position}>
            {/* 3D Sensor Buoy Mesh */}
            <mesh
              scale={isHovered ? 1.4 : 1.0}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHoveredStation(buoy.station_id)
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                setHoveredStation(null)
                document.body.style.cursor = 'auto'
              }}
              onClick={(e) => {
                e.stopPropagation()
                setClickedStation((prev) => (prev === buoy.station_id ? null : buoy.station_id))
                onSelectBuoy?.(buoy)
              }}
            >
              {isFloat ? (
                <cylinderGeometry args={[0.03, 0.045, 0.08, 12]} />
              ) : (
                <sphereGeometry args={[0.05, 16, 16]} />
              )}
              <meshStandardMaterial
                color={showPopup ? '#ffffff' : markerColor}
                emissive={markerColor}
                emissiveIntensity={showPopup ? 0.9 : 0.55}
              />
            </mesh>

            {/* Glowing Telemetry Beacon Halo */}
            {!showPopup && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.065, 0.08, 20]} />
                <meshBasicMaterial color={markerColor} transparent opacity={0.4} />
              </mesh>
            )}

            {/* Telemetry HUD card */}
            {showPopup && (
              <Html distanceFactor={7.5} style={{ pointerEvents: 'none' }}>
                <div
                  className="panel buoy-telemetry-hud"
                  style={{
                    padding: '10px 14px',
                    fontSize: 12,
                    minWidth: 220,
                    maxWidth: 270,
                    transform: 'translate(-50%, -130%)',
                    pointerEvents: 'auto',
                    borderLeft: `3px solid ${markerColor}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: markerColor,
                          boxShadow: `0 0 0 3px rgba(47, 184, 198, 0.25)`,
                        }}
                      />
                      <span style={{ color: 'var(--text)', fontSize: '0.8rem' }}>
                        {isFloat ? buoy.name : `Station ${buoy.station_id}`}
                      </span>
                    </div>
                    <button
                      onClick={() => setClickedStation(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', marginBottom: 6 }}>
                    {buoy.operator} &middot; {buoy.ocean}
                  </div>

                  <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text)', lineHeight: 1.55 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Water Temp:</span>
                      <strong style={{ color: 'var(--accent)' }}>{fmt(buoy.water_temp_c, '°C')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Air Temp:</span>
                      <span>{fmt(buoy.air_temp_c, '°C')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Wave Height:</span>
                      <span>{fmt(buoy.wave_height_m, 'm')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Wind Speed:</span>
                      <span>{fmt(buoy.wind_speed_kts, 'kts')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Pressure:</span>
                      <span>{fmt(buoy.pressure_hpa, 'hPa')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Salinity:</span>
                      <span>{fmt(buoy.salinity_psu, 'PSU')}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 6, paddingTop: 4, borderTop: '1px solid var(--line)', fontSize: '0.62rem', color: 'var(--text-dim)' }}>
                    Coordinates: {Math.abs(buoy.latitude).toFixed(2)}°{buoy.latitude >= 0 ? 'N' : 'S'},{' '}
                    {Math.abs(buoy.longitude).toFixed(2)}°{buoy.longitude >= 0 ? 'E' : 'W'}
                  </div>
                </div>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}
