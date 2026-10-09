import { useState, useEffect } from 'react'
import * as THREE from 'three'

// Satellite mode uses a colour map and a separate cloud shell. Surface and
// Grid Points intentionally use a simple ocean colour so realistic land does
// not compete with the temperature data. Both maps degrade gracefully to null.
//
// Cache-busted with a version query string: these files got replaced in place
// (same filenames) while fixing the material, so without this a browser that
// already cached the old copies would keep showing the old, broken look even
// after the underlying files changed on disk.
const ASSET_VERSION = 'v2'
const PATHS = {
  dayMap: `/textures/earth-daymap.jpg?${ASSET_VERSION}`,
  cloudsMap: `/textures/earth-clouds.png?${ASSET_VERSION}`,
}

function loadOne(loader, path, isColor) {
  return new Promise((resolve) => {
    loader.load(
      path,
      (tex) => {
        if (isColor) tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 8
        tex.wrapS = THREE.RepeatWrapping
        resolve(tex)
      },
      undefined,
      (err) => {
        console.warn(`Earth texture failed to load from ${path}. Falling back to flat color.`, err)
        resolve(null)
      }
    )
  })
}

export function useEarthMaps() {
  const [maps, setMaps] = useState({
    dayMap: null,
    cloudsMap: null,
  })

  useEffect(() => {
    let cancelled = false
    const loader = new THREE.TextureLoader()

    Promise.all([
      loadOne(loader, PATHS.dayMap, true),
      loadOne(loader, PATHS.cloudsMap, true),
    ]).then(([dayMap, cloudsMap]) => {
      if (cancelled) return
      setMaps({ dayMap, cloudsMap })
    })

    return () => {
      cancelled = true
    }
  }, [])

  return maps
}
