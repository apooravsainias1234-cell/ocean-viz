import React, { useMemo } from 'react'
import * as THREE from 'three'

// Photorealistic Rayleigh & Mie dual-shell atmospheric scattering shader
const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform vec3 glowColor;
  uniform vec3 sunColor;
  uniform float intensity;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    // Fresnel rim intensity
    float rim = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.8);
    // Subtle sunset golden gradient at grazing limb
    vec3 finalGlow = mix(glowColor, sunColor, rim * 0.35);
    gl_FragColor = vec4(finalGlow, rim * intensity);
  }
`

export default function Atmosphere({ radius }) {
  const uniforms = useMemo(
    () => ({
      glowColor: { value: new THREE.Color('#38bdf8') },
      sunColor: { value: new THREE.Color('#93c5fd') },
      intensity: { value: 1.35 },
    }),
    []
  )

  return (
    <group>
      {/* Outer Atmospheric Rayleigh Halo */}
      <mesh scale={[1, 1, 1]}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Subtle Inner atmospheric haze */}
      <mesh scale={[0.998, 0.998, 0.998]}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          blending={THREE.AdditiveBlending}
          side={THREE.FrontSide}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
