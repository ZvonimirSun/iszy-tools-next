// geohash.js
// Geohash library for Javascript
// (c) 2008 David Troy
// (c) 2010 Chris Williams
// Distributed under the MIT License

const BITS = [16, 8, 4, 2, 1] as const

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'
type GeoHashDirection = 'right' | 'left' | 'top' | 'bottom'
type Parity = 'even' | 'odd'
type Interval = [number, number]

interface GeoPoint {
  latitude: number
  longitude: number
}

type DirectionParityMap = Record<GeoHashDirection, Record<Parity, string>>

const NEIGHBORS: DirectionParityMap = {
  right: {
    even: 'bc01fg45238967deuvhjyznpkmstqrwx',
    odd: 'p0r21436x8zb9dcf5h7kjnmqesgutwvy',
  },
  left: {
    even: '238967debc01fg45kmstqrwxuvhjyznp',
    odd: '14365h7k9dcfesgujnmqp0r2twvyx8zb',
  },
  top: {
    even: 'p0r21436x8zb9dcf5h7kjnmqesgutwvy',
    odd: 'bc01fg45238967deuvhjyznpkmstqrwx',
  },
  bottom: {
    even: '14365h7k9dcfesgujnmqp0r2twvyx8zb',
    odd: '238967debc01fg45kmstqrwxuvhjyznp',
  },
}

const BORDERS: DirectionParityMap = {
  right: {
    even: 'bcfguvyz',
    odd: 'prxz',
  },
  left: {
    even: '0145hjnp',
    odd: '028b',
  },
  top: {
    even: 'prxz',
    odd: 'bcfguvyz',
  },
  bottom: {
    even: '028b',
    odd: '0145hjnp',
  },
}

function refineInterval(interval: Interval, cd: number, mask: number): void {
  if (cd & mask) {
    interval[0] = (interval[0] + interval[1]) / 2
  }
  else {
    interval[1] = (interval[0] + interval[1]) / 2
  }
}

export function encodeGeoHash(coordinateText: string): string
export function encodeGeoHash(latitude: number, longitude: number): string
export function encodeGeoHash(latitudeOrText: number | string, longitude?: number): string {
  let latitude = latitudeOrText

  if (typeof latitudeOrText === 'string') {
    const tmp = latitudeOrText.split(',')
    if (tmp.length >= 2) {
      const latitudeText = tmp[0]
      const longitudeText = tmp[1]
      if (latitudeText === undefined || longitudeText === undefined) {
        throw new TypeError('Not Supported')
      }
      latitude = Number.parseFloat(latitudeText)
      longitude = Number.parseFloat(longitudeText)
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        throw new TypeError('Not Supported')
      }
    }
    else {
      throw new Error('Not Supported')
    }
  }

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new TypeError('Not Supported')
  }

  let isEven = true
  const lat: Interval = [-90.0, 90.0]
  const lon: Interval = [-180.0, 180.0]
  let bit = 0
  let ch = 0
  const precision = 12
  let geohash = ''

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lon[0] + lon[1]) / 2
      if (longitude > mid) {
        ch |= BITS[bit] ?? 0
        lon[0] = mid
      }
      else {
        lon[1] = mid
      }
    }
    else {
      const mid = (lat[0] + lat[1]) / 2
      if (latitude > mid) {
        ch |= BITS[bit] ?? 0
        lat[0] = mid
      }
      else {
        lat[1] = mid
      }
    }

    isEven = !isEven
    if (bit < 4) {
      bit++
    }
    else {
      const encodedChar = BASE32[ch]
      if (encodedChar === undefined) {
        throw new Error('Not Supported')
      }
      geohash += encodedChar
      bit = 0
      ch = 0
    }
  }
  return geohash
}

export function decodeGeoHash(geohash: string): GeoPoint {
  let isEven = true
  const lat: Interval = [-90.0, 90.0]
  const lon: Interval = [-180.0, 180.0]

  for (let i = 0; i < geohash.length; i++) {
    const c = geohash[i]
    if (c === undefined) {
      throw new TypeError('Not Supported')
    }
    const cd = BASE32.indexOf(c)
    if (cd < 0) {
      throw new TypeError('Not Supported')
    }
    for (let j = 0; j < 5; j++) {
      const mask = BITS[j] ?? 0
      if (isEven) {
        refineInterval(lon, cd, mask)
      }
      else {
        refineInterval(lat, cd, mask)
      }
      isEven = !isEven
    }
  }
  const latitude = (lat[0] + lat[1]) / 2
  const longitude = (lon[0] + lon[1]) / 2

  return { latitude, longitude }
}

export function calculateAdjacent(srcHash: string, dir: GeoHashDirection): string {
  srcHash = srcHash.toLowerCase()
  const lastChr = srcHash.charAt(srcHash.length - 1)
  const type: Parity = (srcHash.length % 2) ? 'odd' : 'even'
  let base = srcHash.substring(0, srcHash.length - 1)
  if (BORDERS[dir][type].includes(lastChr)) {
    base = calculateAdjacent(base, dir)
  }
  const neighborIndex = NEIGHBORS[dir][type].indexOf(lastChr)
  const adjacentChar = BASE32[neighborIndex]
  if (adjacentChar === undefined) {
    throw new TypeError('Not Supported')
  }
  return base + adjacentChar
}
