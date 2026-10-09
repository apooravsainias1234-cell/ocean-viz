import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { latLonToVec3 } from './buoyData.js'

const SPHERE_RADIUS = 2
const FLY_DURATION_S = 1.1

// Lives inside <Canvas>. Whenever `target` changes to a new
// { latitude, longitude } pair, smoothly orbits the camera to look at that
// point on the globe from its current distance (so zoom level is preserved).
// This is what makes search results and "locate me" actually feel like
// flying to a place, rather than just teleporting.
export default function CameraFlyTo({ target, controlsRef }) {
  const { camera } = useThree()
  const animRef = useRef(null)

  useEffect(() => {
    if (!target) return

    const surfacePoint = new THREE.Vector3(...latLonToVec3(target.latitude, target.longitude, SPHERE_RADIUS))
    const direction = surfacePoint.clone().normalize()

    // Normally we preserve the current camera distance from the globe
    // center so zoom level doesn't jump when flying to a new place. An
    // explicit `target.distance` (used by the "Reset view" action) opts out
    // of that, so a fully zoomed-in user can get back to the default framing
    // in one step instead of first having to scroll/pinch back out.
    const distance = typeof target.distance === 'number' ? target.distance : camera.position.length()
    const endPos = direction.clone().multiplyScalar(distance)

    animRef.current = {
      startPos: camera.position.clone(),
      endPos,
      startTime: performance.now(),
    }
  }, [target, camera])

  useFrame(() => {
    const anim = animRef.current
    if (!anim) return

    const elapsed = (performance.now() - anim.startTime) / 1000
    const t = Math.min(elapsed / FLY_DURATION_S, 1)
    // Ease-in-out so the motion feels natural, not linear/robotic.
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

    camera.position.lerpVectors(anim.startPos, anim.endPos, eased)
    camera.lookAt(0, 0, 0)
    controlsRef?.current?.update?.()

    if (t >= 1) {
      animRef.current = null
    }
  })

  return null
}
