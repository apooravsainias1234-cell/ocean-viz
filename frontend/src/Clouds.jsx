import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// Sits just outside the earth sphere. Drifting slowly and independently of
// the planet underneath it is what sells "clouds" rather than "a texture" -
// real satellite/weather globes always have this subtle relative motion.
export default function Clouds({ radius, cloudsMap }) {
  const ref = useRef()

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.006
    }
  })

  if (!cloudsMap) return null

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[radius, 64, 64]} />
      {/* The PNG already carries cloud coverage in its alpha channel.
          alphaMap samples a colour channel instead, which turns the otherwise
          transparent parts of this texture into an opaque white shell. */}
      <meshBasicMaterial
        map={cloudsMap}
        transparent
        depthWrite={false}
        opacity={0.72}
      />
    </mesh>
  )
}
