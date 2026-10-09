import React from 'react'
import { getColormapCssGradient, COLORMAPS } from './colormaps.js'
import { SST_MIN, SST_MAX } from './fakeData.js'

export default function Legend({ sampleCount, sourceDate, colormapId = 'turbo', viewMode = 'texture' }) {
  const isMhw = viewMode === 'mhw'
  const activeColormap = isMhw ? 'mhw' : colormapId
  const gradient = getColormapCssGradient(activeColormap)
  const cmapMeta = COLORMAPS[activeColormap] || COLORMAPS.turbo

  return (
    <div
      className="panel overlay-panel legend-panel"
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        padding: '10px 16px',
        width: 250,
        animationDelay: '180ms',
      }}
    >
      <div className="panel-label" style={{ marginBottom: 6, textAlign: 'center' }}>
        {isMhw ? 'Marine Heatwave Anomaly' : 'Sea Surface Temperature'}
        <span style={{ marginLeft: 6, color: 'var(--accent)' }}>
          ({cmapMeta.name})
        </span>
        {sourceDate && (
          <span style={{ display: 'block', marginTop: 2, letterSpacing: '0.02em', textTransform: 'none', fontSize: '0.62rem' }}>
            NOAA OISST &middot; {sourceDate} {sampleCount ? `(${sampleCount.toLocaleString()} pts)` : ''}
          </span>
        )}
      </div>

      <div
        style={{
          height: 10,
          borderRadius: 2,
          background: gradient,
          border: '1px solid rgba(0,0,0,0.3)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
        }}
      />

      <div style={{ position: 'relative', height: 4, marginTop: 3 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <span
            key={f}
            style={{
              position: 'absolute',
              left: `${f * 100}%`,
              top: 0,
              width: 1,
              height: 4,
              background: 'var(--line-strong)',
              transform: 'translateX(-0.5px)',
            }}
          />
        ))}
      </div>

      <div
        className="mono"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.68rem',
          color: 'var(--text-dim)',
          marginTop: 4,
        }}
      >
        {isMhw ? (
          <>
            <span>0°C</span>
            <span>+1.5°C</span>
            <span>+2.5°C</span>
            <span>+3.5°C</span>
            <span>+5°C</span>
          </>
        ) : (
          <>
            <span>{SST_MIN}&deg;C</span>
            <span>6&deg;C</span>
            <span>15&deg;C</span>
            <span>23&deg;C</span>
            <span>{SST_MAX}&deg;C</span>
          </>
        )}
      </div>
    </div>
  )
}
