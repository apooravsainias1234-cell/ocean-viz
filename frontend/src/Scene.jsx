import React, { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import OceanPanel from './OceanPanel.jsx'
import CameraFlyTo from './CameraFlyTo.jsx'

export default function Scene({
  sstGrid,
  buoyReading,
  viewMode,
  colormapId,
  monthIndex,
  showCurrents,
  currentsSpeed,
  showTrenches,
  showReefs = true,
  showPlaceLabels,
  transectPointA,
  transectPointB,
  onSetTransectA,
  onSetTransectB,
  onClearTransect,
  onOpenSlicer,
  flyToTarget,
  onPointFocused,
  onHoverPoint,
  activeBuoyId,
  onSelectBuoy,
  autoRotate = false,
  dayNightLight = true,
}) {
  const controlsRef = useRef()

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 48 }}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
    >
      {/* Space background clear color */}
      <color attach="background" args={['#030a10']} />

      {/* Ambient lighting */}
      <ambientLight intensity={dayNightLight ? 0.35 : 0.8} />

      {/* Atmospheric planetary hemisphere fill light */}
      <hemisphereLight args={['#7dd3fc', '#020617', 0.45]} />

      {/* Sun directional light with warm specular radiance */}
      <directionalLight
        position={[5, 3.2, 5]}
        intensity={dayNightLight ? 2.2 : 1.2}
        color="#fffbeb"
      />

      {/* Subtle rim backlight for outer planetary limb */}
      <directionalLight position={[-6, -2, -4]} intensity={0.4} color="#38bdf8" />

      {/* Photorealistic deep-space starfield */}
      <Stars radius={90} depth={50} count={4500} factor={4} fade speed={0.4} />

      <OceanPanel
        sstGrid={sstGrid}
        buoyReading={buoyReading}
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
        onSetTransectA={onSetTransectA}
        onSetTransectB={onSetTransectB}
        onClearTransect={onClearTransect}
        onOpenSlicer={onOpenSlicer}
        onPointFocused={onPointFocused}
        onHoverPoint={onHoverPoint}
        activeBuoyId={activeBuoyId}
        onSelectBuoy={onSelectBuoy}
      />

      <CameraFlyTo target={flyToTarget} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={2.6}
        maxDistance={12}
        enableDamping={true}
        dampingFactor={0.06}
        autoRotate={autoRotate}
        autoRotateSpeed={0.45}
      />
    </Canvas>
  )
}
