import React, { useState } from 'react'
import { audioEngine } from './audioEngine.js'

export default function VitalsBar({ onBookmark, isOffline, onRetryBackend }) {
  const [audioActive, setAudioActive] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleAudio = () => {
    const active = audioEngine.toggle()
    setAudioActive(active)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  const takeSnapshot = () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `ocean-viz-telemetry-${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div
      className="panel vitals-bar"
      style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 15,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '6px 18px',
        maxWidth: '92vw',
        whiteSpace: 'nowrap',
        overflowX: 'auto',
      }}
    >
      {/* Real-time Ticker Metrics */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.72rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-dim)' }}>GLOBAL SST:</span>
          <span className="mono" style={{ fontWeight: 600, color: 'var(--accent)' }}>
            21.14°C
          </span>
        </div>

        <span style={{ color: 'var(--line)' }}>&vert;</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-dim)' }}>MHW ALERT:</span>
          <span
            style={{
              fontWeight: 600,
              fontSize: '0.65rem',
              padding: '1px 5px',
              borderRadius: 2,
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
            }}
          >
            CAT II ACTIVE
          </span>
        </div>

        <span style={{ color: 'var(--line)' }}>&vert;</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-dim)' }}>ENSO:</span>
          <span className="mono" style={{ fontWeight: 600, color: '#38bdf8' }}>
            NEUTRAL (+0.4°C)
          </span>
        </div>

        <span style={{ color: 'var(--line)' }}>&vert;</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-dim)' }}>BUOY FLEET:</span>
          <span className="mono" style={{ fontWeight: 600, color: '#34d399' }}>
            14 STATIONS LIVE
          </span>
        </div>

        {isOffline && (
          <>
            <span style={{ color: 'var(--line)' }}>&vert;</span>
            <button
              onClick={onRetryBackend}
              className="btn-live"
              title="Click to reconnect live backend server"
              style={{
                fontSize: '0.62rem',
                padding: '2px 6px',
                borderRadius: 2,
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                cursor: 'pointer',
              }}
            >
              OFFLINE CACHE &middot; RETRY LIVE
            </button>
          </>
        )}
      </div>

      <span style={{ width: 1, height: 16, background: 'var(--line)' }} />

      {/* Quick Camera Bookmarks */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Bookmarks:</span>
        <BookmarkChip label="Global" onClick={() => onBookmark({ lat: 0, lon: -90, dist: 6 })} />
        <BookmarkChip label="Hatteras (41002)" onClick={() => onBookmark({ lat: 31.7, lon: -74.9, dist: 4.2 })} />
        <BookmarkChip label="Gulf Stream" onClick={() => onBookmark({ lat: 36.0, lon: -68.0, dist: 4.6 })} />
        <BookmarkChip label="Indian Ocean (NIOT)" onClick={() => onBookmark({ lat: 14.0, lon: 82.0, dist: 4.8 })} />
        <BookmarkChip label="Mariana Trench" onClick={() => onBookmark({ lat: 11.3, lon: 142.6, dist: 4.4 })} />
      </div>

      <span style={{ width: 1, height: 16, background: 'var(--line)' }} />

      {/* Mission Control Action Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={toggleAudio}
          className={`btn-live ${audioActive ? 'active' : ''}`}
          title={audioActive ? 'Mute Deep-Sea Hydrophone Ambience' : 'Listen to Procedural Hydrophone Ambience'}
          style={{
            background: audioActive ? 'var(--accent)' : 'transparent',
            color: audioActive ? 'var(--deep)' : 'var(--text)',
            border: '1px solid var(--line)',
            borderRadius: 3,
            padding: '4px 7px',
            fontSize: '0.72rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>{audioActive ? '🔊' : '🔈'}</span>
          <span>Hydrophone</span>
        </button>

        <button
          onClick={takeSnapshot}
          className="btn-live"
          title="Export Telemetry Screenshot"
          style={{
            background: 'transparent',
            color: 'var(--text)',
            border: '1px solid var(--line)',
            borderRadius: 3,
            padding: '4px 7px',
            fontSize: '0.72rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>📷</span>
          <span>Snapshot</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="btn-live"
          title="Toggle Fullscreen Mode"
          style={{
            background: 'transparent',
            color: 'var(--text)',
            border: '1px solid var(--line)',
            borderRadius: 3,
            padding: '4px 7px',
            fontSize: '0.72rem',
            cursor: 'pointer',
          }}
        >
          {isFullscreen ? '⤢ Exit' : '⤢ Fullscreen'}
        </button>
      </div>
    </div>
  )
}

function BookmarkChip({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="btn-live"
      style={{
        background: 'rgba(47, 184, 198, 0.08)',
        border: '1px solid var(--line)',
        color: 'var(--text)',
        borderRadius: 2,
        padding: '2px 6px',
        fontSize: '0.65rem',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}
