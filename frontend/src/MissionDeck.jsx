import React, { useState } from 'react'
import { COLORMAPS } from './colormaps.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function MissionDeck({
  viewMode,
  colormapId,
  setColormapId,
  showCurrents,
  setShowCurrents,
  currentsSpeed,
  setCurrentsSpeed,
  showTrenches,
  setShowTrenches,
  showReefs,
  setShowReefs,
  showPlaceLabels,
  setShowPlaceLabels,
  dayNightLight,
  setDayNightLight,
  autoRotate,
  setAutoRotate,
  onResetView,
  onOpenSlicer,
  monthIndex,
  setMonthIndex,
  isPlayingMonth,
  setIsPlayingMonth,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('layers') // 'layers' | 'timeline' | 'palette'

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="panel btn-live deck-collapsed-pill"
        style={{
          position: 'absolute',
          top: 76,
          left: 16,
          zIndex: 25,
          padding: '8px 14px',
          background: 'rgba(5, 24, 33, 0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--accent)',
          borderRadius: 20,
          color: 'var(--text)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.74rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        }}
      >
        <span style={{ color: 'var(--accent)' }}>◨</span>
        <span style={{ fontWeight: 600 }}>Mission Deck</span>
      </button>
    )
  }

  return (
    <aside
      className="panel mission-deck"
      style={{
        position: 'absolute',
        top: 76,
        left: 16,
        zIndex: 25,
        width: 280,
        padding: '12px 14px',
        background: 'rgba(5, 24, 33, 0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header & Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 3 }}>
          <TabButton active={activeTab === 'layers'} onClick={() => setActiveTab('layers')} label="Layers" />
          <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} label="Timeline" />
          <TabButton active={activeTab === 'palette'} onClick={() => setActiveTab('palette')} label="Palettes" />
        </div>

        <button
          onClick={() => setCollapsed(true)}
          title="Minimize Mission Deck"
          className="btn-live"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '0.78rem',
            cursor: 'pointer',
            padding: '2px 4px',
          }}
        >
          ▲ Hide
        </button>
      </div>

      {/* Tab 1: Layers & Geospatial Overlays */}
      {activeTab === 'layers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <LayerRow
            active={showCurrents}
            onToggle={() => setShowCurrents((v) => !v)}
            icon="🌊"
            label="Ocean Current Streamlines"
          />
          {showCurrents && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 6px', background: 'var(--well)', borderRadius: 4, marginLeft: 16 }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>Speed:</span>
              <input
                type="range"
                min={0.2}
                max={2.5}
                step={0.1}
                value={currentsSpeed}
                onChange={(e) => setCurrentsSpeed(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text)' }}>{currentsSpeed}x</span>
            </div>
          )}

          <LayerRow
            active={showTrenches}
            onToggle={() => setShowTrenches((v) => !v)}
            icon="🏔️"
            label="Deep Hadal Trenches & Ridges"
          />

          <LayerRow
            active={showReefs}
            onToggle={() => setShowReefs((v) => !v)}
            icon="🐠"
            label="Coral Reefs & Bleaching Alert"
          />

          <LayerRow
            active={dayNightLight}
            onToggle={() => setDayNightLight((v) => !v)}
            icon="☀️"
            label="Sun Specular & Terminator"
          />

          <LayerRow
            active={showPlaceLabels}
            onToggle={() => setShowPlaceLabels((v) => !v)}
            icon="🏷️"
            label="Ocean Basins & Cities"
          />
        </div>
      )}

      {/* Tab 2: 12-Month Temporal Simulation Engine */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Month:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>
                {MONTHS[monthIndex]}
              </span>
              <button
                onClick={() => setIsPlayingMonth((p) => !p)}
                className="btn-live"
                style={{
                  background: isPlayingMonth ? 'var(--accent)' : 'rgba(47, 184, 198, 0.15)',
                  color: isPlayingMonth ? 'var(--deep)' : 'var(--text)',
                  border: '1px solid var(--line)',
                  borderRadius: 3,
                  padding: '2px 8px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isPlayingMonth ? '❚❚ Pause' : '▶ Play'}
              </button>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={11}
            step={1}
            value={monthIndex}
            onChange={(e) => setMonthIndex(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--text-dim)' }}>
            <span>Jan (Winter N)</span>
            <span>Jul (Summer N)</span>
            <span>Dec</span>
          </div>

          <p style={{ margin: '4px 0 0', fontSize: '0.64rem', color: 'var(--text-dim)', lineHeight: 1.35 }}>
            Simulates annual global insolation shifts, polar sea-ice boundaries, and monsoon circulation.
          </p>
        </div>
      )}

      {/* Tab 3: Colormap Palettes */}
      {activeTab === 'palette' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.values(COLORMAPS).filter((c) => c.id !== 'mhw').map((cmap) => {
            const isSelected = colormapId === cmap.id
            return (
              <button
                key={cmap.id}
                onClick={() => setColormapId(cmap.id)}
                className="btn-live"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 4,
                  background: isSelected ? 'rgba(47, 184, 198, 0.2)' : 'var(--well)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--line)'}`,
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                }}
              >
                <span style={{ fontWeight: isSelected ? 600 : 400 }}>{cmap.name}</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>{cmap.description}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Bottom Quick Tools */}
      <div style={{ display: 'flex', gap: 5, paddingTop: 8, borderTop: '1px solid var(--line)' }}>
        <button
          onClick={() => onOpenSlicer?.()}
          className="btn-live"
          style={{
            flex: 1,
            padding: '5px 8px',
            fontSize: '0.68rem',
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid var(--line)',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🤿 Slicer
        </button>

        <button
          onClick={() => setAutoRotate((r) => !r)}
          className={`btn-live ${autoRotate ? 'active' : ''}`}
          title={autoRotate ? 'Stop Rotation' : 'Auto-Rotate Globe'}
          style={{
            padding: '5px 8px',
            fontSize: '0.68rem',
            background: autoRotate ? 'var(--accent)' : 'transparent',
            color: autoRotate ? 'var(--deep)' : 'var(--text)',
            border: '1px solid var(--line)',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          🔄 Orbit
        </button>

        <button
          onClick={onResetView}
          className="btn-live"
          title="Reset Camera Framing"
          style={{
            padding: '5px 8px',
            fontSize: '0.68rem',
            background: 'transparent',
            color: 'var(--text)',
            border: '1px solid var(--line)',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          🎯 Reset
        </button>
      </div>
    </aside>
  )
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`btn-live ${active ? 'active' : ''}`}
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--deep)' : 'var(--text-dim)',
        border: 'none',
        borderRadius: 3,
        padding: '3px 8px',
        fontSize: '0.67rem',
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function LayerRow({ active, onToggle, icon, label }) {
  return (
    <div
      onClick={onToggle}
      className="btn-live"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 8px',
        borderRadius: 4,
        background: active ? 'rgba(47, 184, 198, 0.14)' : 'rgba(2, 14, 19, 0.4)',
        border: `1px solid ${active ? 'rgba(47, 184, 198, 0.35)' : 'var(--line)'}`,
        cursor: 'pointer',
        fontSize: '0.72rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span>{icon}</span>
        <span style={{ color: active ? 'var(--text)' : 'var(--text-dim)', fontWeight: active ? 600 : 400 }}>
          {label}
        </span>
      </div>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: active ? 'var(--accent)' : 'var(--line-strong)',
          boxShadow: active ? '0 0 6px var(--accent)' : 'none',
        }}
      />
    </div>
  )
}
