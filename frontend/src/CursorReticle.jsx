import React from 'react'
import { pointToBasinName } from './pointInfo.js'

export default function CursorReticle({ hoverPoint }) {
  if (!hoverPoint) return null

  const latLabel = `${Math.abs(hoverPoint.latitude).toFixed(2)}°${hoverPoint.latitude >= 0 ? 'N' : 'S'}`
  const lonLabel = `${Math.abs(hoverPoint.longitude).toFixed(2)}°${hoverPoint.longitude >= 0 ? 'E' : 'W'}`

  // Estimate physical characteristics
  const basin = pointToBasinName?.(hoverPoint.latitude, hoverPoint.longitude) || 'Pelagic Ocean'
  const estTemp = (28 - (Math.abs(hoverPoint.latitude) / 90) * 28).toFixed(1)

  return (
    <div
      className="panel cursor-reticle-hud"
      style={{
        position: 'absolute',
        bottom: 84,
        right: 16,
        zIndex: 12,
        padding: '6px 12px',
        fontSize: '0.7rem',
        animation: 'none',
        borderLeft: '2px solid var(--accent)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
        <span className="mono" style={{ fontWeight: 600, color: 'var(--text)' }}>
          {latLabel}, {lonLabel}
        </span>
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>
        {basin} &middot; <span className="mono" style={{ color: 'var(--accent)' }}>~{estTemp}°C</span>
      </div>
    </div>
  )
}
