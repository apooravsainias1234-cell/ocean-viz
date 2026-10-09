import React from 'react'
import SearchBar from './SearchBar.jsx'

export default function TopBar({
  viewMode,
  setViewMode,
  onLocationFound,
  onBookmark,
  isOffline,
  onRetryBackend,
  zenMode,
  setZenMode,
  audioActive,
  toggleAudio,
  takeSnapshot,
  isFullscreen,
  toggleFullscreen,
}) {
  return (
    <header
      className="panel top-command-bar"
      style={{
        position: 'absolute',
        top: 14,
        left: 16,
        right: 16,
        zIndex: 35,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 14px',
        background: 'rgba(5, 24, 33, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.55)',
        gap: 12,
      }}
    >
      {/* 1. Left: Brand & Telemetry Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <LiveDot ok={!isOffline} />
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.01em', lineHeight: 1.1, color: 'var(--text)' }}>
              Ocean Data Viz
            </div>
            <div className="panel-label" style={{ fontSize: '0.58rem', letterSpacing: '0.06em', marginTop: 1 }}>
              NOAA OISST &middot; Station 41002
            </div>
          </div>
        </div>

        {/* View Mode Segmented Pill */}
        <div
          role="group"
          aria-label="View Mode Selector"
          style={{
            display: 'flex',
            background: 'var(--well)',
            border: '1px solid var(--line)',
            borderRadius: 5,
            padding: 2,
            gap: 2,
            marginLeft: 4,
          }}
        >
          <ModeChip active={viewMode === 'texture'} onClick={() => setViewMode('texture')} label="Surface SST" />
          <ModeChip active={viewMode === 'mhw'} onClick={() => setViewMode('mhw')} label="🔥 Heatwaves" />
          <ModeChip active={viewMode === 'satellite'} onClick={() => setViewMode('satellite')} label="Satellite" />
          <ModeChip active={viewMode === 'points'} onClick={() => setViewMode('points')} label="Grid" />
        </div>
      </div>

      {/* 2. Center: Prominent Unobstructed Search Bar */}
      <div style={{ flex: 1, maxWidth: 360, margin: '0 auto', minWidth: 200 }}>
        <SearchBar onLocationFound={onLocationFound} />
      </div>

      {/* 3. Right: Global Vitals Ticker + Quick Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* Real-time Ticker Metrics */}
        <div className="vitals-ticker-chips" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.68rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'var(--text-dim)' }}>GLOBAL:</span>
            <span className="mono" style={{ fontWeight: 600, color: 'var(--accent)' }}>21.14°C</span>
          </div>

          <span style={{ color: 'var(--line)' }}>&vert;</span>

          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 600,
              padding: '1px 5px',
              borderRadius: 2,
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
            }}
          >
            MHW CAT II
          </span>

          <span style={{ color: 'var(--line)' }}>&vert;</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'var(--text-dim)' }}>FLEET:</span>
            <span className="mono" style={{ fontWeight: 600, color: '#34d399' }}>14 LIVE</span>
          </div>

          {isOffline && (
            <button
              onClick={onRetryBackend}
              className="btn-live"
              title="Click to reconnect live backend server"
              style={{
                fontSize: '0.6rem',
                padding: '2px 5px',
                borderRadius: 2,
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                cursor: 'pointer',
              }}
            >
              CACHE ACTIVE
            </button>
          )}
        </div>

        <span style={{ width: 1, height: 16, background: 'var(--line)' }} />

        {/* Action Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {/* Audio soundscape toggle */}
          <button
            onClick={toggleAudio}
            className={`btn-live ${audioActive ? 'active' : ''}`}
            title={audioActive ? 'Mute Deep-Sea Hydrophone Ambience' : 'Listen to Procedural Hydrophone Ambience'}
            style={{
              background: audioActive ? 'var(--accent)' : 'transparent',
              color: audioActive ? 'var(--deep)' : 'var(--text)',
              border: '1px solid var(--line)',
              borderRadius: 4,
              padding: '4px 7px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>{audioActive ? '🔊' : '🔈'}</span>
            <span className="tool-btn-label">Sound</span>
          </button>

          {/* Zen mode toggle */}
          <button
            onClick={() => setZenMode((z) => !z)}
            className={`btn-live ${zenMode ? 'active' : ''}`}
            title="Toggle Zen Mode (Hides UI for cinematic viewing, press Z)"
            style={{
              background: zenMode ? 'var(--accent)' : 'transparent',
              color: zenMode ? 'var(--deep)' : 'var(--text)',
              border: '1px solid var(--line)',
              borderRadius: 4,
              padding: '4px 7px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <span>🧘</span>
            <span className="tool-btn-label">Zen</span>
          </button>

          {/* Screenshot tool */}
          <button
            onClick={takeSnapshot}
            className="btn-live"
            title="Export High-Res Telemetry PNG"
            style={{
              background: 'transparent',
              color: 'var(--text)',
              border: '1px solid var(--line)',
              borderRadius: 4,
              padding: '4px 7px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <span>📷</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="btn-live"
            title="Toggle Fullscreen"
            style={{
              background: 'transparent',
              color: 'var(--text)',
              border: '1px solid var(--line)',
              borderRadius: 4,
              padding: '4px 7px',
              fontSize: '0.72rem',
              cursor: 'pointer',
            }}
          >
            {isFullscreen ? '⤢' : '⤢'}
          </button>
        </div>
      </div>
    </header>
  )
}

function LiveDot({ ok }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: ok ? 'var(--accent)' : 'var(--warm)',
        boxShadow: ok ? '0 0 0 3px var(--accent-soft)' : '0 0 0 3px var(--warm-soft)',
        flexShrink: 0,
      }}
    />
  )
}

function ModeChip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`btn-live ${active ? 'active' : ''}`}
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--deep)' : 'var(--text)',
        border: 'none',
        borderRadius: 3,
        padding: '3px 8px',
        fontSize: '0.67rem',
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}
