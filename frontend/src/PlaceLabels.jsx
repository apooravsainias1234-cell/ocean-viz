import { useState, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { latLonToVec3 } from './buoyData.js'
import { PLACE_LABELS } from './placeLabels.js'

const SPHERE_RADIUS = 2
const DETAIL_LABEL_DISTANCE = 5.5

const LABELS_WITH_POSITIONS = PLACE_LABELS.map((place) => {
  const position = latLonToVec3(place.lat, place.lon, SPHERE_RADIUS + 0.015)
  const direction = new THREE.Vector3(...position).normalize()
  return { ...place, position, direction }
})

export default function PlaceLabels() {
  const { camera } = useThree()
  const [visibleNames, setVisibleNames] = useState(() => new Set())
  const frameCount = useRef(0)

  useFrame(() => {
    frameCount.current += 1
    if (frameCount.current % 6 !== 0) return

    const camDir = camera.position.clone().normalize()
    const showDetail = camera.position.length() < DETAIL_LABEL_DISTANCE

    const next = new Set()
    for (const label of LABELS_WITH_POSITIONS) {
      const isWater = label.type === 'ocean' || label.type === 'sea'
      if (!isWater && !showDetail) continue
      if (label.direction.dot(camDir) > 0.15) next.add(label.name)
    }
    setVisibleNames(next)
  })

  return (
    <>
      {LABELS_WITH_POSITIONS.filter((l) => visibleNames.has(l.name)).map((place) => {
        const isWater = place.type === 'ocean' || place.type === 'sea'
        return (
          <Html key={place.name} position={place.position} distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div
              style={{
                color: isWater ? '#8fd9e8' : '#f2f2f2',
                fontSize: isWater ? 10 : 8,
                fontWeight: isWater ? 600 : 500,
                letterSpacing: isWater ? '0.09em' : '0.02em',
                textTransform: isWater ? 'uppercase' : 'none',
                textShadow: '0 1px 4px rgba(0,0,0,0.95)',
                whiteSpace: 'nowrap',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {place.name}
            </div>
          </Html>
        )
      })}
    </>
  )
}
