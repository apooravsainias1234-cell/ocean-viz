import React, { useState } from 'react'

export default function ControlPanel({
  historyLength,
  historyIndex,
  setHistoryIndex,
  lastUpdated,
  refreshMessage,
}) {
  const [minimized, setMinimized] = useState(false)

  if (historyLength <= 1) return null

  const atLatest = historyIndex === 0
  const atOldest = historyIndex === historyLength - 1

  const stepHistory = (dir) => {
    setHistoryIndex((prev) => Math.min(historyLength - 1, Math.max(0, prev + dir)))
  }

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="panel btn-live"
        style={{
          position: 'absolute',
          top: 76,
          right: 16,
          zIndex: 25,
          padding: '6px 12px',
          background: 'rgba(5, 24, 33, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--line)',
          borderRadius: 20,
          color: 'var(--text)',
          cursor: 'pointer',
          fontSize: '0.7rem',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ color: 'var(--warm)' }}>●</span>
        <span>Buoy 41002 History ({atLatest ? 'LIVE' : `T−${historyIndex}`})</span>
      </button>
    )
  }

  return (
    <div
      className="panel overlay-panel control-panel"
      style={{
        position: 'absolute',
        top: 76,
        right: 16,
        zIndex: 25,
        padding: '10px 14px',
        width: 220,
        background: 'rgba(5, 24, 33, 0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="panel-label">Station 41002</span>
          <span className="mono" style={{ fontSize: '0.68rem', fontWeight: 600, color: atLatest ? 'var(--accent)' : 'var(--warm)' }}>
            {atLatest ? 'LIVE' : `T−${historyIndex}`}
          </span>
        </div>
        <button
          onClick={() => setMinimized(true)}
          title="Minimize buoy history"
          className="btn-live"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            padding: '1px 3px',
          }}
        >
          ▲
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <StepButton disabled={atOldest} onClick={() => stepHistory(1)} label="Step back in time">
          &lsaquo;
        </StepButton>
        <input
          type="range"
          min={0}
          max={historyLength - 1}
          step={1}
          value={historyIndex}
          onChange={(e) => setHistoryIndex(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <StepButton disabled={atLatest} onClick={() => stepHistory(-1)} label="Step forward in time">
          &rsaquo;
        </StepButton>
      </div>

      <div style={{ marginTop: 4, fontSize: '0.6rem', color: 'var(--text-dim)', textAlign: 'center' }}>
        {atLatest ? 'Most recent telemetry feed' : `${historyIndex} reading${historyIndex === 1 ? '' : 's'} ago`}
        {lastUpdated && <span> &middot; {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
      </div>

      {refreshMessage && (
        <div role="status" style={{ marginTop: 4, color: 'var(--danger)', fontSize: '0.6rem', textAlign: 'center' }}>
          {refreshMessage}
        </div>
      )}
    </div>
  )
}

function StepButton({ disabled, onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="btn-live"
      style={{
        background: 'transparent',
        border: '1px solid var(--line)',
        color: disabled ? 'var(--text-dim)' : 'var(--text)',
        borderRadius: 3,
        width: 22,
        height: 22,
        lineHeight: 1,
        fontSize: '0.85rem',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}
