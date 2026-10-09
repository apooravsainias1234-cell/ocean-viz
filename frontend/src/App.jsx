import React, { useState, useEffect, useCallback } from 'react'
import Scene from './Scene.jsx'
import TopBar from './TopBar.jsx'
import MissionDeck from './MissionDeck.jsx'
import ControlPanel from './ControlPanel.jsx'
import Legend from './Legend.jsx'
import SceneErrorBoundary from './SceneErrorBoundary.jsx'
import DepthPanel from './DepthPanel.jsx'
import GpsPanel from './GpsPanel.jsx'
import CursorReticle from './CursorReticle.jsx'
import DepthSlicerModal from './DepthSlicerModal.jsx'
import { fetchSstGrid, fetchBuoyHistory, checkHealth, API_BASE } from './api.js'
import { generateGlobalFallbackGrid } from './fallbackGrid.js'
import { audioEngine } from './audioEngine.js'

const HISTORY_LIMIT = 10

export default function App() {
  const [sstGrid, setSstGrid] = useState(null)
  const [buoyHistory, setBuoyHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshMessage, setRefreshMessage] = useState('')

  // View modes: 'texture' (Surface SST) | 'mhw' (Marine Heatwaves) | 'satellite' | 'points'
  const [viewMode, setViewMode] = useState('texture')
  const [colormapId, setColormapId] = useState('turbo')

  // Zen mode: minimalist full-screen cinematic globe
  const [zenMode, setZenMode] = useState(false)

  // Seasonal simulation
  const [monthIndex, setMonthIndex] = useState(0)
  const [isPlayingMonth, setIsPlayingMonth] = useState(false)

  // Graphical layers & toggles
  const [showCurrents, setShowCurrents] = useState(true)
  const [currentsSpeed, setCurrentsSpeed] = useState(1.0)
  const [showTrenches, setShowTrenches] = useState(true)
  const [showReefs, setShowReefs] = useState(true)
  const [showPlaceLabels, setShowPlaceLabels] = useState(true)
  const [dayNightLight, setDayNightLight] = useState(true)
  const [autoRotate, setAutoRotate] = useState(false)

  // Audio & Fullscreen
  const [audioActive, setAudioActive] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Panels & modals
  const [depthOpen, setDepthOpen] = useState(false)
  const [slicerOpen, setSlicerOpen] = useState(false)
  const [slicerTemp, setSlicerTemp] = useState(24.5)

  // Transect Tool (Point A & B)
  const [transectPointA, setTransectPointA] = useState(null)
  const [transectPointB, setTransectPointB] = useState(null)

  // Camera & GPS navigation
  const [flyToTarget, setFlyToTarget] = useState(null)
  const [focusedLocation, setFocusedLocation] = useState(null)
  const [hoverPoint, setHoverPoint] = useState(null)
  const [activeBuoyId, setActiveBuoyId] = useState(null)

  const refreshData = useCallback(async () => {
    setRefreshing(true)
    try {
      const [grid, history] = await Promise.all([
        fetchSstGrid(),
        fetchBuoyHistory(HISTORY_LIMIT),
      ])
      setSstGrid(grid)
      setBuoyHistory(history)
      setHistoryIndex((index) => Math.min(index, Math.max(0, history.length - 1)))
      setLastUpdated(new Date())
      setRefreshMessage('')
      setIsOffline(false)
      return true
    } catch (err) {
      console.warn('Backend offline, loading high-resolution global telemetry cache.', err)
      const fallback = generateGlobalFallbackGrid()
      setSstGrid(fallback)
      setBuoyHistory([
        { station_id: '41002', water_temp_c: 29.1, air_temp_c: 28.8, wave_height_m: 0.8, pressure_hpa: 1017.2, month: 9, day: 11, hour: 19, minute: 30, latitude: 31.759, longitude: -74.936 },
        { station_id: '41002', water_temp_c: 29.2, air_temp_c: 28.9, wave_height_m: 0.8, pressure_hpa: 1017.0, month: 9, day: 11, hour: 19, minute: 20, latitude: 31.759, longitude: -74.936 },
        { station_id: '41002', water_temp_c: 29.1, air_temp_c: 28.8, wave_height_m: 0.8, pressure_hpa: 1017.1, month: 9, day: 11, hour: 19, minute: 10, latitude: 31.759, longitude: -74.936 },
      ])
      setLastUpdated(new Date())
      setIsOffline(true)
      return false
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [])

  const handleLocationFound = (result) => {
    setFlyToTarget({ latitude: result.latitude, longitude: result.longitude })
    setFocusedLocation(result)
  }

  const handlePointFocused = ({ latitude, longitude, tempC }) => {
    setFocusedLocation({ latitude, longitude, name: null })
    if (tempC != null) setSlicerTemp(tempC)
  }

  const handleResetView = () => {
    setFlyToTarget({ latitude: 0, longitude: -90, distance: 6, reset: true })
  }

  const handleBookmark = ({ lat, lon, dist }) => {
    setFlyToTarget({ latitude: lat, longitude: lon, distance: dist })
  }

  const handleSelectBuoy = (buoy) => {
    setActiveBuoyId(buoy.station_id)
    setFlyToTarget({ latitude: buoy.latitude, longitude: buoy.longitude, distance: 4.2 })
  }

  const handleOpenSlicer = (temp) => {
    if (temp != null) setSlicerTemp(temp)
    setSlicerOpen(true)
  }

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
    link.download = `ocean-viz-snapshot-${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        await checkHealth()
        if (!cancelled) await refreshData()
      } catch {
        if (!cancelled) await refreshData()
      }
    }
    loadData()
    return () => {
      cancelled = true
    }
  }, [refreshData])

  // Keyboard shortcuts
  useEffect(() => {
    const handleShortcut = (event) => {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName))) return
      if (event.key === '1') setViewMode('texture')
      if (event.key === '2') setViewMode('mhw')
      if (event.key === '3') setViewMode('satellite')
      if (event.key === '4') setViewMode('points')
      if (event.key.toLowerCase() === 'z') setZenMode((z) => !z)
      if (event.key.toLowerCase() === 'c') setShowCurrents((v) => !v)
      if (event.key.toLowerCase() === 't') setShowTrenches((v) => !v)
      if (event.key.toLowerCase() === 'r') refreshData().catch(() => {})
      if (event.key === '0') handleResetView()
      if (event.code === 'Space') {
        event.preventDefault()
        setIsPlayingMonth((p) => !p)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [refreshData])

  const currentReading = buoyHistory[historyIndex] ?? null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div className="scene-vignette" aria-hidden="true" />

      {/* Zen Mode Restore Floating Button */}
      {zenMode && (
        <button
          onClick={() => setZenMode(false)}
          className="panel btn-live"
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            padding: '6px 16px',
            background: 'rgba(5, 24, 33, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--accent)',
            borderRadius: 20,
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>👁️ Restore HUD (Press Z)</span>
        </button>
      )}

      {/* Main UI Overlay (Hidden in Zen mode) */}
      <div
        className={`ui-hud-container ${zenMode ? 'zen-hidden' : ''}`}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: zenMode ? 'none' : 'auto',
          opacity: zenMode ? 0 : 1,
          transition: 'opacity 300ms ease',
          zIndex: 20,
        }}
      >
        {/* Unified Top Command Header */}
        <TopBar
          viewMode={viewMode}
          setViewMode={setViewMode}
          onLocationFound={handleLocationFound}
          onBookmark={handleBookmark}
          isOffline={isOffline}
          onRetryBackend={refreshData}
          zenMode={zenMode}
          setZenMode={setZenMode}
          audioActive={audioActive}
          toggleAudio={toggleAudio}
          takeSnapshot={takeSnapshot}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
        />

        {/* Collapsible Mission Deck (Left Island) */}
        {!loading && (
          <MissionDeck
            viewMode={viewMode}
            colormapId={colormapId}
            setColormapId={setColormapId}
            showCurrents={showCurrents}
            setShowCurrents={setShowCurrents}
            currentsSpeed={currentsSpeed}
            setCurrentsSpeed={setCurrentsSpeed}
            showTrenches={showTrenches}
            setShowTrenches={setShowTrenches}
            showReefs={showReefs}
            setShowReefs={setShowReefs}
            showPlaceLabels={showPlaceLabels}
            setShowPlaceLabels={setShowPlaceLabels}
            dayNightLight={dayNightLight}
            setDayNightLight={setDayNightLight}
            autoRotate={autoRotate}
            setAutoRotate={setAutoRotate}
            onResetView={handleResetView}
            onOpenSlicer={handleOpenSlicer}
            monthIndex={monthIndex}
            setMonthIndex={setMonthIndex}
            isPlayingMonth={isPlayingMonth}
            setIsPlayingMonth={setIsPlayingMonth}
          />
        )}

        {/* Collapsible Buoy Telemetry History (Right Island) */}
        {!loading && (
          <ControlPanel
            historyLength={buoyHistory.length}
            historyIndex={historyIndex}
            setHistoryIndex={setHistoryIndex}
            lastUpdated={lastUpdated}
            refreshMessage={refreshMessage}
          />
        )}

        {/* Dynamic Colorbar Legend (Bottom Center) */}
        {!loading && (
          <Legend
            sampleCount={sstGrid?.count ?? sstGrid?.points?.length}
            sourceDate={sstGrid?.source_date}
            colormapId={colormapId}
            viewMode={viewMode}
          />
        )}

        {/* Depth Profile Chart (Bottom Left) */}
        {!loading && (
          <DepthPanel
            surfaceTempC={currentReading?.water_temp_c ?? slicerTemp}
            open={depthOpen}
            onToggle={() => setDepthOpen((prev) => !prev)}
          />
        )}

        {/* GPS Readout (Bottom Right) */}
        {!loading && (
          <GpsPanel
            focusedLocation={focusedLocation}
            onLocate={handleLocationFound}
          />
        )}

        {/* Real-time Cursor Hover Reticle */}
        <CursorReticle hoverPoint={hoverPoint} />
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="panel" style={{ ...overlayMessageStyle, padding: '24px 32px' }}>
          <BootSpinner />
          <p style={{ margin: '14px 0 0', fontSize: '0.9rem', fontWeight: 600 }}>Loading Ocean Telemetry&hellip;</p>
          <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 6 }}>
            Connecting to {API_BASE}
          </p>
        </div>
      )}

      {/* Volumetric Ocean Depth Slicer Dialog */}
      <DepthSlicerModal
        open={slicerOpen}
        onClose={() => setSlicerOpen(false)}
        currentSurfaceTemp={slicerTemp}
      />

      {/* 3D WebGL Canvas Scene */}
      <SceneErrorBoundary>
        <Scene
          sstGrid={sstGrid}
          buoyReading={currentReading}
          viewMode={viewMode}
          colormapId={colormapId}
          monthIndex={monthIndex}
          showCurrents={showCurrents}
          currentsSpeed={currentsSpeed}
          showTrenches={showTrenches}
          showReefs={showReefs}
          showPlaceLabels={showPlaceLabels}
          transectPointA={transectPointA}
          transectPointB={transectPointB}
          onSetTransectA={(pt) => setTransectPointA(pt)}
          onSetTransectB={(pt) => setTransectPointB(pt)}
          onClearTransect={() => {
            setTransectPointA(null)
            setTransectPointB(null)
          }}
          onOpenSlicer={handleOpenSlicer}
          autoRotate={autoRotate}
          dayNightLight={dayNightLight}
          flyToTarget={flyToTarget}
          onPointFocused={handlePointFocused}
          onHoverPoint={setHoverPoint}
          activeBuoyId={activeBuoyId}
          onSelectBuoy={handleSelectBuoy}
        />
      </SceneErrorBoundary>
    </div>
  )
}

const overlayMessageStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 30,
  textAlign: 'center',
}

function BootSpinner() {
  return (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--accent)',
            animation: `boot-dot 1s ease-in-out ${i * 0.16}s infinite alternate`,
          }}
        />
      ))}
    </div>
  )
}
