import { encodeTime, ulid } from 'ulid'

export interface UlidOptions {
  count: number
  lowercase?: boolean
  timestamp?: number
}

export function generateUlids(options: UlidOptions) {
  const count = clampInteger(options.count, 1, 1000)
  return Array.from({ length: count }, () => {
    const id = createUlid(options.timestamp)
    return options.lowercase ? id.toLowerCase() : id
  })
}

export function createUlid(timestamp?: number) {
  if (timestamp === 0) {
    return `${encodeTime(0)}${ulid(1).slice(10)}`
  }

  return ulid(timestamp)
}

export { encodeTime }

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(max, Math.max(min, Math.trunc(value)))
}
