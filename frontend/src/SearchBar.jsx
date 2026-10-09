import React, { useState, useRef, useCallback, useEffect } from 'react'
import { searchLocation } from './geocode.js'
import { OCEAN_CURRENTS } from './oceanCurrentsData.js'
import { SEABED_FEATURES } from './trenchesData.js'
import { GLOBAL_BUOYS } from './buoyFleetData.js'
import { CORAL_REEFS } from './coralReefsData.js'

const SpeechRecognitionCtor =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

// Curated instant-pick recommendations
const QUICK_PICKS = [
  { name: 'Cape Hatteras (Station 41002)', type: 'buoy', lat: 31.759, lon: -74.936, badge: 'NOAA Buoy' },
  { name: 'Gulf Stream Current', type: 'current', lat: 36.0, lon: -68.0, badge: 'Warm Current' },
  { name: 'Mariana Trench (10,994m)', type: 'trench', lat: 11.373, lon: 142.592, badge: 'Deepest Abyss' },
  { name: 'Bay of Bengal Observatory', type: 'buoy', lat: 14.0, lon: 87.0, badge: 'INCOIS India' },
  { name: 'Great Barrier Reef', type: 'reef', lat: -18.28, lon: 147.7, badge: 'Coral Sanctuary' },
  { name: 'Hawaii Central Pacific (51001)', type: 'buoy', lat: 24.44, lon: -162.0, badge: 'PacIOOS' },
  { name: 'Antarctic Circumpolar Current', type: 'current', lat: -56.0, lon: -70.0, badge: 'ACC Flow' },
]

export default function SearchBar({ onLocationFound }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle') // idle | searching | listening | error
  const [errorMsg, setErrorMsg] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const recognitionRef = useRef(null)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Global hotkey: Cmd+K / Ctrl+K or '/' focuses the search bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setIsFocused(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Dismiss suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const runSearch = useCallback(
    async (text) => {
      const q = (text ?? query).trim()
      if (!q) return

      // Direct coordinate parsing: e.g. "18.5, 72.8" or "18.5 72.8"
      const coordMatch = q.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/)
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1])
        const lon = parseFloat(coordMatch[3])
        if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
          setIsFocused(false)
          onLocationFound({ latitude: lat, longitude: lon, name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°` })
          return
        }
      }

      setStatus('searching')
      setErrorMsg('')
      try {
        const result = await searchLocation(q)
        if (!result) {
          setStatus('error')
          setErrorMsg(`No location found for "${q}".`)
          return
        }
        setStatus('idle')
        setIsFocused(false)
        onLocationFound(result)
      } catch (err) {
        setStatus('error')
        setErrorMsg(err.message || 'Search failed.')
      }
    },
    [query, onLocationFound]
  )

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      runSearch()
    },
    [runSearch]
  )

  const handleSelectQuickPick = (item) => {
    setQuery(item.name)
    setIsFocused(false)
    onLocationFound({
      latitude: item.lat,
      longitude: item.lon,
      name: item.name,
    })
  }

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) return
    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setStatus('listening')
    recognition.onerror = (e) => {
      setStatus('error')
      setErrorMsg(e.error === 'not-allowed' ? 'Mic access denied.' : `Voice error: ${e.error}`)
    }
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setQuery(transcript)
      runSearch(transcript)
    }
    recognition.onend = () => {
      setStatus((prev) => (prev === 'listening' ? 'idle' : prev))
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [runSearch])

  // Filtered suggestions based on query
  const suggestions = query.trim()
    ? [
        ...OCEAN_CURRENTS.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())).map((c) => ({
          name: c.name,
          lat: c.points[0].lat,
          lon: c.points[0].lon,
          badge: 'Current',
        })),
        ...SEABED_FEATURES.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())).map((f) => ({
          name: f.name,
          lat: f.lat,
          lon: f.lon,
          badge: 'Trench',
        })),
        ...GLOBAL_BUOYS.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()) || b.station_id.includes(query)).map((b) => ({
          name: `${b.name} (${b.station_id})`,
          lat: b.latitude,
          lon: b.longitude,
          badge: 'Buoy',
        })),
        ...CORAL_REEFS.filter((r) => r.name.toLowerCase().includes(query.toLowerCase())).map((r) => ({
          name: r.name,
          lat: r.lat,
          lon: r.lon,
          badge: 'Coral Reef',
        })),
      ].slice(0, 5)
    : QUICK_PICKS

  return (
    <div
      ref={containerRef}
      className="search-bar-unified"
      style={{
        position: 'relative',
        zIndex: 40,
        width: 320,
        maxWidth: '100%',
      }}
    >
      <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(2, 14, 19, 0.75)',
            border: `1px solid ${isFocused ? 'var(--accent)' : 'var(--line)'}`,
            borderRadius: 6,
            padding: '2px 6px',
            boxShadow: isFocused ? '0 0 12px var(--accent-soft)' : 'none',
            transition: 'all 180ms ease',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: isFocused ? 'var(--accent)' : 'var(--text-dim)', padding: '0 4px' }}>
            ⌕
          </span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Search ocean, place, buoy... (⌘K)"
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              color: 'var(--text)',
              border: 'none',
              padding: '6px 6px',
              fontSize: '0.74rem',
              outline: 'none',
            }}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                padding: '2px 4px',
              }}
            >
              ✕
            </button>
          )}

          {SpeechRecognitionCtor && (
            <button
              type="button"
              onClick={startListening}
              title="Voice Search"
              className="btn-live"
              style={{
                background: status === 'listening' ? 'var(--warm)' : 'transparent',
                color: status === 'listening' ? 'var(--deep)' : 'var(--text-dim)',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 2,
              }}
            >
              <MicIcon />
            </button>
          )}

          <button
            type="submit"
            title="Execute Search"
            className="btn-live"
            style={{
              background: 'var(--accent)',
              color: 'var(--deep)',
              border: 'none',
              borderRadius: 3,
              cursor: 'pointer',
              padding: '4px 7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 4,
            }}
          >
            <ArrowIcon />
          </button>
        </div>
      </form>

      {/* Auto-suggest dropdown drawer */}
      {isFocused && (
        <div
          className="panel search-suggestions-drawer"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'rgba(6, 26, 36, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--line-strong)',
            borderRadius: 6,
            padding: '6px 8px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75)',
            maxHeight: 260,
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: '0.6rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 6px', fontWeight: 600 }}>
            {query.trim() ? 'Matched Ocean Entities' : 'Quick Ocean Destinations'}
          </div>

          {suggestions.map((item, idx) => (
            <div
              key={idx}
              onMouseDown={() => handleSelectQuickPick(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.72rem',
                color: 'var(--text)',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(47, 184, 198, 0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.name}
              </span>
              <span
                style={{
                  fontSize: '0.6rem',
                  padding: '1px 5px',
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-dim)',
                  marginLeft: 8,
                  flexShrink: 0,
                }}
              >
                {item.badge}
              </span>
            </div>
          ))}

          {status === 'searching' && (
            <div style={{ padding: '6px 8px', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
              Querying planetary geocoder&hellip;
            </div>
          )}

          {status === 'error' && (
            <div style={{ padding: '6px 8px', fontSize: '0.68rem', color: 'var(--danger)' }}>
              {errorMsg}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
