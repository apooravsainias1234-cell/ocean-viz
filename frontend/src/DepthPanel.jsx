import React, { useMemo } from 'react'
import { generateIllustrativeDepthProfile } from './depthProfile.js'

// A collapsible panel showing an illustrative ocean depth/temperature
// profile, drawn as a simple SVG line chart. Plain HTML/CSS + inline SVG,
// not part of the 3D scene.
export default function DepthPanel({ surfaceTempC, open, onToggle }) {
  const profile = useMemo(() => generateIllustrativeDepthProfile(surfaceTempC), [surfaceTempC])

  const width = 220
  const height = 150
  const padding = 26

  const maxDepth = profile[profile.length - 1].depth
  const temps = profile.map((p) => p.temp)
  const minTemp = Math.min(...temps)
  const maxTemp = Math.max(...temps)
  const tempRange = maxTemp - minTemp || 1

  // Depth increases downward on screen, temperature increases rightward —
  // matches how oceanographers usually draw these profile charts.
  const points = profile.map((p) => {
    const x = padding + ((p.temp - minTemp) / tempRange) * (width - padding * 2)
    const y = padding + (p.depth / maxDepth) * (height - padding * 2)
    return { x, y }
  })
  const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ')
  const areaStr = `${padding},${height - padding} ${pointsStr} ${width - padding},${height - padding}`

  return (
    <div
      className="panel overlay-panel"
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        zIndex: 10,
        width: open ? 252 : 'auto',
        animationDelay: '240ms',
      }}
    >
      <button
        onClick={onToggle}
        className="btn-live depth-toggle"
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: 'var(--text)',
          padding: '10px 14px',
          textAlign: 'left',
          cursor: 'pointer',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}
      >
        <Chevron open={open} />
        <span className="panel-label" style={{ color: 'var(--text)' }}>
          Depth profile
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 14px 12px' }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height="auto"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block', margin: '0 auto', maxWidth: width }}
          >
            <defs>
              <linearGradient id="depthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* horizontal gridlines at quarter-depth intervals */}
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1={padding}
                y1={padding + f * (height - padding * 2)}
                x2={width - padding}
                y2={padding + f * (height - padding * 2)}
                stroke="var(--line)"
                strokeDasharray="2 3"
              />
            ))}

            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="var(--line-strong)" />
            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              stroke="var(--line-strong)"
            />

            <polygon points={areaStr} fill="url(#depthFill)" />
            <polyline points={pointsStr} fill="none" stroke="var(--accent)" strokeWidth="2" />

            {/* surface point marker */}
            <circle cx={points[0].x} cy={points[0].y} r="3" fill="var(--warm)" />
          </svg>
          <div
            className="mono"
            style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.68rem' }}
          >
            <span>{minTemp}&deg;C</span>
            <span style={{ color: 'var(--warm)' }}>{maxTemp}&deg;C surface</span>
          </div>
          <div className="mono" style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: 2, fontSize: '0.68rem' }}>
            0&ndash;{maxDepth}m depth
          </div>
          <p style={{ color: 'var(--text-dim)', marginTop: 8, marginBottom: 0, lineHeight: 1.45, fontSize: '0.68rem' }}>
            Illustrative only &mdash; modeled from a typical thermocline shape, not
            measured depth data. Surface value is anchored to the real buoy reading.
          </p>
        </div>
      )}
    </div>
  )
}

function Chevron({ open }) {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 24 24"
      fill="none"
      style={{
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 180ms ease',
        flexShrink: 0,
      }}
    >
      <path d="M8 5l8 7-8 7" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
