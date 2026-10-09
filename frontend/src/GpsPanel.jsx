import React, { useState, useCallback } from 'react'

// Small "GPS unit" style readout: shows whatever lat/lon is currently
// focused (last search result or last click on the globe), and a
// "Locate me" button that uses the browser's real Geolocation API to find
// the user's own position and hand it to the parent the same way a search
// result would (so it reuses the exact same fly-to-location code path).
export default function GpsPanel({ focusedLocation, onLocate }) {
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.')
      return
    }
    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        onLocate({
          kind: 'user',
          name: 'Your location',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      (err) => {
        setLocating(false)
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was denied.'
            : 'Could not determine your location.'
        )
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }, [onLocate])

  const latLabel = focusedLocation
    ? `${Math.abs(focusedLocation.latitude).toFixed(2)}°${focusedLocation.latitude >= 0 ? 'N' : 'S'}`
    : '——.——'
  const lonLabel = focusedLocation
    ? `${Math.abs(focusedLocation.longitude).toFixed(2)}°${focusedLocation.longitude >= 0 ? 'E' : 'W'}`
    : '——.——'

  return (
    <div
      className="panel overlay-panel"
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 10,
        padding: '10px 14px',
        minWidth: 168,
        animationDelay: '210ms',
      }}
    >
      <div className="panel-label" style={{ marginBottom: 6 }}>
        Coordinates
      </div>
      <div className="mono" style={{ fontSize: '0.95rem', letterSpacing: '0.01em', marginBottom: 4 }}>
        {latLabel}
      </div>
      <div className="mono" style={{ fontSize: '0.95rem', letterSpacing: '0.01em', marginBottom: 8 }}>
        {lonLabel}
      </div>
      {focusedLocation?.name && (
        <div
          style={{
            color: 'var(--text-dim)',
            marginBottom: 8,
            fontSize: '0.68rem',
            borderTop: '1px solid var(--line)',
            paddingTop: 6,
          }}
        >
          {focusedLocation.name}
        </div>
      )}
      <button
        onClick={handleLocate}
        disabled={locating}
        className="btn-live"
        style={{
          background: locating ? 'transparent' : 'var(--accent)',
          color: locating ? 'var(--text-dim)' : 'var(--deep)',
          border: locating ? '1px solid var(--line)' : 'none',
          borderRadius: 2,
          padding: '6px 8px',
          fontSize: '0.7rem',
          fontWeight: 600,
          cursor: locating ? 'default' : 'pointer',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        }}
      >
        <TargetIcon spinning={locating} />
        {locating ? 'Locating…' : 'Locate me'}
      </button>
      {error && <div style={{ color: 'var(--danger)', marginTop: 6, fontSize: '0.65rem' }}>{error}</div>}
    </div>
  )
}

function TargetIcon({ spinning }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      style={{
        animation: spinning ? 'target-spin 1s linear infinite' : 'none',
        flexShrink: 0,
      }}
    >
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <style>{`
        @keyframes target-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  )
}
