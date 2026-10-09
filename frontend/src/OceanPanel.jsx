import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { useSstTexture } from './useSstTexture.js'
import { useEarthMaps } from './useEarthMaps.js'
import Clouds from './Clouds.jsx'
import Atmosphere from './Atmosphere.jsx'
import BuoyMarker from './BuoyMarker.jsx'
import SstPoints from './SstPoints.jsx'
import PointInfoPopup from './PointInfoPopup.jsx'
import PlaceLabels from './PlaceLabels.jsx'
import OceanCurrents from './OceanCurrents.jsx'
import SeabedFeatures from './SeabedFeatures.jsx'
import CoralReefs from './CoralReefs.jsx'
import SonarPingEffect from './SonarPingEffect.jsx'
import TransectTool from './TransectTool.jsx'
import { findNearestGridPoint, buildPointInfo } from './pointInfo.js'
import { audioEngine } from './audioEngine.js'

const SPHERE_RADIUS = 2

function unwrapPoints(sstResponse) {
  if (!sstResponse) return []
  if (Array.isArray(sstResponse)) return sstResponse
  return sstResponse.data ?? sstResponse.points ?? sstResponse.grid ?? sstResponse.results ?? []
}

function vec3ToLatLon(point, radius) {
  const clampedY = Math.max(-radius, Math.min(radius, point.y))
  const phi = Math.acos(clampedY / radius)
  let theta = Math.atan2(point.z, -point.x)
  if (theta < 0) theta += 2 * Math.PI

  const lat = 90 - (phi * 180) / Math.PI
  const lon = (theta * 180) / Math.PI - 180
  return [lat, lon]
}

export default function OceanPanel({
  sstGrid,
  buoyReading,
  viewMode = 'texture',
  colormapId = 'turbo',
  monthIndex = 0,
  showCurrents = true,
  currentsSpeed = 1.0,
  showTrenches = true,
  showReefs = true,
  showPlaceLabels = true,
  transectPointA = null,
  transectPointB = null,
  onSetTransectA,
  onSetTransectB,
  onClearTransect,
  onOpenSlicer,
  onPointFocused,
  onHoverPoint,
  activeBuoyId,
  onSelectBuoy,
}) {
  const groupRef = useRef()
  const isMhwMode = viewMode === 'mhw'
  const texture = useSstTexture(sstGrid, colormapId, monthIndex, isMhwMode)
  const { dayMap, cloudsMap } = useEarthMaps()
  const [clickedInfo, setClickedInfo] = useState(null)
  const [sonarPing, setSonarPing] = useState(null)

  useEffect(() => {
    if (!clickedInfo) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setClickedInfo(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clickedInfo])

  const showInfoAt = useCallback(
    (lat, lon, realTempC, positionArray) => {
      const info = buildPointInfo(lat, lon, realTempC)
      setClickedInfo({ position: positionArray, info })
      setSonarPing({ position: positionArray, time: Date.now() })
      audioEngine.playSonarPing()
      onPointFocused?.({ latitude: lat, longitude: lon, tempC: info.tempC })
    },
    [onPointFocused]
  )

  const handleSphereClick = useCallback(
    (e) => {
      e.stopPropagation()
      const [lat, lon] = vec3ToLatLon(e.point, SPHERE_RADIUS)
      const points = unwrapPoints(sstGrid)
      const nearest = findNearestGridPoint(points, lat, lon)
      const realTempC = nearest ? nearest.sst_celsius : null
      const dir = e.point.clone().normalize()
      const markerPos = dir.multiplyScalar(SPHERE_RADIUS + 0.03)
      showInfoAt(lat, lon, realTempC, [markerPos.x, markerPos.y, markerPos.z])
    },
    [sstGrid, showInfoAt]
  )

  const handlePointerMove = useCallback(
    (e) => {
      if (!onHoverPoint) return
      const [lat, lon] = vec3ToLatLon(e.point, SPHERE_RADIUS)
      onHoverPoint({ latitude: lat, longitude: lon })
    },
    [onHoverPoint]
  )

  const handleGridPointClick = useCallback(
    (point) => {
      const [x, y, z] = point.position
      showInfoAt(point.latitude, point.longitude, point.sst_celsius, [x, y, z])
    },
    [showInfoAt]
  )

  const geometry = useMemo(() => new THREE.SphereGeometry(SPHERE_RADIUS + 0.01, 128, 128), [])

  return (
    <group ref={groupRef}>
      {/* Base Globe Sphere with realistic ocean material */}
      <mesh
        onClick={viewMode === 'satellite' ? handleSphereClick : undefined}
        onPointerMove={viewMode === 'satellite' ? handlePointerMove : undefined}
      >
        <sphereGeometry args={[SPHERE_RADIUS, 128, 128]} />
        {viewMode === 'satellite' && dayMap ? (
          <meshBasicMaterial map={dayMap} />
        ) : (
          <meshStandardMaterial
            color="#041520"
            roughness={0.4}
            metalness={0.1}
          />
        )}
      </mesh>

      {/* Cloud shell + atmospheric halo in Satellite mode */}
      {viewMode === 'satellite' && (
        <>
          <Clouds radius={SPHERE_RADIUS + 0.016} cloudsMap={cloudsMap} />
          <Atmosphere radius={SPHERE_RADIUS + 0.12} />
        </>
      )}

      {/* Surface SST Texture / MHW Heatwave Mode */}
      {(viewMode === 'texture' || viewMode === 'mhw') && texture && (
        <mesh
          geometry={geometry}
          onClick={handleSphereClick}
          onPointerMove={handlePointerMove}
        >
          <meshStandardMaterial
            map={texture}
            roughness={0.35}
            metalness={0.15}
          />
        </mesh>
      )}

      {/* Atmospheric Rayleigh glow halo softly visible on ocean texture mode */}
      {(viewMode === 'texture' || viewMode === 'mhw') && (
        <Atmosphere radius={SPHERE_RADIUS + 0.11} />
      )}

      {/* Points Mode */}
      {viewMode === 'points' && (
        <mesh
          geometry={geometry}
          onClick={handleSphereClick}
          onPointerMove={handlePointerMove}
        >
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {viewMode === 'points' && (
        <SstPoints sstGrid={sstGrid} onPointClick={handleGridPointClick} />
      )}

      {/* Animated Ocean Current Streamlines */}
      <OceanCurrents
        visible={showCurrents}
        speedMultiplier={currentsSpeed}
      />

      {/* Deep-Sea Bathymetric Trenches & Seamounts */}
      <SeabedFeatures
        visible={showTrenches}
      />

      {/* Coral Reef Sanctuaries & Bleaching Vulnerability */}
      <CoralReefs
        visible={showReefs}
      />

      {/* Interactive 3D Expanding Sonar Ping Ripple */}
      <SonarPingEffect ping={sonarPing} />

      {/* Great-Circle Transect Tool (Point A & B) */}
      <TransectTool
        pointA={transectPointA}
        pointB={transectPointB}
        onClear={onClearTransect}
      />

      {/* Place & Ocean Basin Labels */}
      {showPlaceLabels && <PlaceLabels />}

      {/* Global Buoy & Argo Float Array */}
      <BuoyMarker
        reading={buoyReading}
        activeBuoyId={activeBuoyId}
        onSelectBuoy={onSelectBuoy}
      />

      {/* Interactive Click Popup */}
      <PointInfoPopup
        position={clickedInfo?.position}
        info={clickedInfo?.info}
        onClose={() => setClickedInfo(null)}
        onSetTransectA={onSetTransectA}
        onSetTransectB={onSetTransectB}
        onOpenSlicer={onOpenSlicer}
      />
    </group>
  )
}
