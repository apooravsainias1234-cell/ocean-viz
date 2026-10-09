import React from 'react'
import { Html } from '@react-three/drei'
import PredictionPanel from './PredictionPanel.jsx'

export default function PointInfoPopup({ position, info, onClose, onSetTransectA, onSetTransectB, onOpenSlicer }) {
  if (!position || !info) return null

  const latLabel = `${Math.abs(info.latitude).toFixed(2)}°${info.latitude >= 0 ? 'N' : 'S'}`
  const lonLabel = `${Math.abs(info.longitude).toFixed(2)}°${info.longitude >= 0 ? 'E' : 'W'}`

  // Thermodynamic Ocean Heat Content (0-200m photic column)
  const effectiveDepth = Math.min(200, info.depthM || 150)
  const heatContentGj = Math.round((info.tempC * 4.184 * 1.025 * effectiveDepth) / 10) / 10

  const heatStress =
    info.tempC >= 29.5
      ? { label: 'CRW Alert Level 2 (Severe)', color: '#ef4444' }
      : info.tempC >= 28.0
      ? { label: 'Thermal Warning (Elevated)', color: '#f59e0b' }
      : { label: 'Thermal Baseline (Stable)', color: '#10b981' }

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#7fd8e6" emissiveIntensity={0.8} />
      </mesh>

      <Html distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div
          className="panel"
          style={{
            padding: '12px 15px',
            fontSize: 12,
            whiteSpace: 'normal',
            width: 245,
            transform: 'translate(-50%, -130%)',
            pointerEvents: 'auto',
            animation: 'none',
            background: 'rgba(5, 24, 33, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--line-strong)',
            borderRadius: 6,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <span className="mono" style={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--text)' }}>
              {latLabel}, {lonLabel}
            </span>
            <button
              onClick={onClose}
              title="Close popup"
              aria-label="Close"
              className="btn-live"
              style={{
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                pointerEvents: 'auto',
                padding: 0,
                fontSize: '0.85rem',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          <div className="mono" style={{ lineHeight: 1.6, color: 'var(--text)', fontSize: '0.74rem' }}>
            <ReadoutRow label="Sea Surface Temp" value={`${info.tempC}°C`} muted={!info.isTempReal} highlight />
            <ReadoutRow label="Water Column Depth" value={`${info.depthM} m`} muted />
            <ReadoutRow label="Wave Swell Height" value={`${info.waveM} m`} muted />
            <ReadoutRow label="Salinity Practical" value={`${info.salinityPsu} PSU`} muted />
            <ReadoutRow label="Ocean Heat Content" value={`${heatContentGj} GJ/m²`} muted />
          </div>

          {/* Biological / Thermal Status */}
          <div style={{ marginTop: 6, paddingTop: 5, borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>Thermal Stress:</span>
            <span style={{ color: heatStress.color, fontWeight: 600 }}>{heatStress.label}</span>
          </div>

          {/* Action Tools */}
          <div style={{ display: 'flex', gap: 4, marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--line)' }}>
            <button
              onClick={() => onSetTransectA?.(info)}
              className="btn-live"
              style={{
                flex: 1,
                fontSize: '0.62rem',
                padding: '4px 0',
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#86efac',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 3,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Transect A
            </button>
            <button
              onClick={() => onSetTransectB?.(info)}
              className="btn-live"
              style={{
                flex: 1,
                fontSize: '0.62rem',
                padding: '4px 0',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 3,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Transect B
            </button>
            <button
              onClick={() => onOpenSlicer?.(info.tempC)}
              className="btn-live"
              style={{
                fontSize: '0.62rem',
                padding: '4px 7px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 3,
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title="Inspect vertical water column slicer at this coordinate"
            >
              Depth Slicer
            </button>
          </div>

          <PredictionPanel info={info} />
        </div>
      </Html>
    </group>
  )
}

function ReadoutRow({ label, value, muted, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, whiteSpace: 'nowrap' }}>
      <span style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span style={{ color: highlight ? 'var(--accent)' : muted ? 'var(--text-dim)' : 'var(--text)', fontWeight: highlight ? 600 : 400 }}>
        {value}
        {muted && <span style={{ opacity: 0.6, fontSize: '0.62rem' }}> est.</span>}
      </span>
    </div>
  )
}
