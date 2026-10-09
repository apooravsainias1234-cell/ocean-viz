import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export default function SonarPingEffect({ ping }) {
  const meshRef = useRef()
  const ringRef = useRef()

  useFrame((_, delta) => {
    if (!ping) return
    if (ringRef.current) {
      const age = (Date.now() - ping.time) / 1000 // seconds
      if (age < 1.6) {
        const scale = 1 + age * 2.8
        ringRef.current.scale.set(scale, scale, scale)
        if (ringRef.current.material) {
          ringRef.current.material.opacity = Math.max(0, 0.85 * (1 - age / 1.6))
        }
      } else {
        if (ringRef.current.material) {
          ringRef.current.material.opacity = 0
        }
      }
    }
  })

  if (!ping) return null

  // Orient ring to align with sphere surface normal at position
  const pos = new THREE.Vector3(...ping.position)
  const norm = pos.clone().normalize()
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), norm)

  return (
    <group position={ping.position} quaternion={quat} ref={meshRef}>
      {/* Core ping beacon flash */}
      <mesh>
        <circleGeometry args={[0.025, 16]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.9} depthWrite={false} />
      </mesh>

      {/* Expanding sonar ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.035, 0.048, 32]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.8} depthWrite={false} />
      </mesh>
    </group>
  )
}
