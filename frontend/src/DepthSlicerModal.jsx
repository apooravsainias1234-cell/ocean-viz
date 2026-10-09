import React, { useState } from 'react'

export const DEPTH_LAYERS = [
  {
    name: 'Epipelagic Zone (Sunlight Zone)',
    range: '0 – 200 m',
    tempRange: '20°C to 30°C (Surface dependent)',
    pressure: '1 to 20 atm',
    light: '100% to 1% sunlight penetration',
    bio: '90% of all marine life, phytoplankton blooms, coral reefs, pelagic fish.',
    color: '#38bdf8',
  },
  {
    name: 'Mesopelagic Zone (Twilight Zone & Thermocline)',
    range: '200 – 1,000 m',
    tempRange: '4°C to 12°C (Sharpest temperature drop)',
    pressure: '20 to 100 atm',
    light: 'Faint blue twilight, no photosynthesis',
    bio: 'Bioluminescent lanternfish, giant squid, diurnal vertical migration.',
    color: '#0284c7',
  },
  {
    name: 'Bathypelagic Zone (Midnight Zone)',
    range: '1,000 – 4,000 m',
    tempRange: '2°C to 4°C',
    pressure: '100 to 400 atm',
    light: 'Perpetual darkness except organism bioluminescence',
    bio: 'Anglerfish, gulper eels, vampire squids, whale fall scavengers.',
    color: '#0369a1',
  },
  {
    name: 'Abyssopelagic Zone (The Abyssal Plain)',
    range: '4,000 – 6,000 m',
    tempRange: '0°C to 2°C (Near freezing)',
    pressure: '400 to 600 atm',
    light: 'Zero sunlight',
    bio: 'Deep-sea sea cucumbers, hydrothermal vent vent-shrimp, xenophyophores.',
    color: '#075985',
  },
  {
    name: 'Hadalpelagic Zone (Hadal Trenches)',
    range: '6,000 – 11,000 m',
    tempRange: '1°C to 4°C',
    pressure: '600 to 1,100 atm (Crushing hydrostatic force)',
    light: 'Pitch black, hyper-isolated trenches',
    bio: 'Snailfish (Pseudoliparis), piezophilic barophilic bacteria, amphipods.',
    color: '#0c4a6e',
  },
]

export default function DepthSlicerModal({ open, onClose, currentSurfaceTemp }) {
  const [selectedDepth, setSelectedDepth] = useState(0) // 0 to 6000 meters

  if (!open) return null

  // Determine current active zone based on selectedDepth
  const activeZone =
    selectedDepth <= 200
      ? DEPTH_LAYERS[0]
      : selectedDepth <= 1000
      ? DEPTH_LAYERS[1]
      : selectedDepth <= 4000
      ? DEPTH_LAYERS[2]
      : selectedDepth <= 6000
      ? DEPTH_LAYERS[3]
      : DEPTH_LAYERS[4]

  const surface = currentSurfaceTemp ?? 24
  // Physically realistic temperature lapse rate
  const calculatedTemp =
    selectedDepth <= 200
      ? (surface - (selectedDepth / 200) * 4).toFixed(1)
      : selectedDepth <= 1000
      ? (surface - 4 - ((selectedDepth - 200) / 800) * (surface - 8)).toFixed(1)
      : (4.0 - ((selectedDepth - 1000) / 5000) * 2.2).toFixed(1)

  const pressureAtm = Math.round(1 + selectedDepth / 10)

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 50,
        backgroundColor: 'rgba(2, 10, 15, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="panel depth-slicer-dialog"
        style={{
          width: '100%',
          maxWidth: 680,
          padding: '24px 28px',
          borderRadius: 6,
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div className="panel-label">Volumetric Ocean Slicer</div>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.25rem', fontWeight: 600 }}>
              Vertical Water Column Architecture
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Depth Slider */}
        <div style={{ marginBottom: 20, background: 'var(--well)', padding: '14px 18px', borderRadius: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Depth Exploration Level:</span>
            <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent)' }}>
              -{selectedDepth.toLocaleString()} m
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={6000}
            step={25}
            value={selectedDepth}
            onChange={(e) => setSelectedDepth(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 4 }}>
            <span>0m Surface</span>
            <span>200m Photics</span>
            <span>1000m Thermocline</span>
            <span>4000m Abyssal Plain</span>
            <span>6000m Trench Edge</span>
          </div>
        </div>

        {/* Live Hydrostatic Readouts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <div className="panel" style={{ padding: '10px 14px', background: 'var(--well)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Water Temperature</div>
            <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 600, color: '#38bdf8', marginTop: 2 }}>
              {calculatedTemp} °C
            </div>
          </div>
          <div className="panel" style={{ padding: '10px 14px', background: 'var(--well)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Hydrostatic Pressure</div>
            <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f59e0b', marginTop: 2 }}>
              {pressureAtm} atm
            </div>
          </div>
          <div className="panel" style={{ padding: '10px 14px', background: 'var(--well)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Zone Classification</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: activeZone.color, marginTop: 4 }}>
              {activeZone.name.split('(')[0]}
            </div>
          </div>
        </div>

        {/* Detailed Zone Description */}
        <div
          style={{
            borderLeft: `4px solid ${activeZone.color}`,
            background: 'rgba(10, 39, 51, 0.4)',
            padding: '14px 18px',
            borderRadius: 4,
            marginBottom: 20,
          }}
        >
          <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: 'var(--text)' }}>
            {activeZone.name} &middot; <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>{activeZone.range}</span>
          </h4>
          <div style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.5, marginBottom: 6 }}>
            <strong>Ecosystem & Habitats:</strong> {activeZone.bio}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
            <strong>Light Penetration:</strong> {activeZone.light}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <button
            onClick={onClose}
            className="btn-live"
            style={{
              background: 'var(--accent)',
              color: 'var(--deep)',
              border: 'none',
              padding: '8px 18px',
              borderRadius: 3,
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Close Slicer
          </button>
        </div>
      </div>
    </div>
  )
}
