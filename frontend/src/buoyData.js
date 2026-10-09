// Converts latitude/longitude (in degrees) into an [x, y, z] position on the
// surface of a sphere of the given radius. This is the standard formula for
// mapping a point on a globe onto 3D space.
export function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180) // polar angle from the top
  const theta = (lon + 180) * (Math.PI / 180) // azimuthal angle around the equator

  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)

  return [x, y, z]
}
