export interface RandomPortOptions {
  min: number
  max: number
  count: number
  unique: boolean
}

const MIN_DYNAMIC_PORT = 1024
const MAX_PORT = 65535

export function generateRandomPorts(options: RandomPortOptions) {
  if (options.min > options.max) {
    throw new Error('最小端口不能大于最大端口')
  }

  const min = clampPort(options.min)
  const max = clampPort(options.max)
  const count = Math.min(1000, Math.max(1, Math.trunc(options.count)))

  if (options.unique && count > max - min + 1) {
    throw new Error('唯一端口数量不能超过范围大小')
  }

  const ports = new Set<number>()
  const result: number[] = []

  while (result.length < count) {
    const port = randomInt(min, max)
    if (options.unique) {
      if (ports.has(port)) {
        continue
      }
      ports.add(port)
    }
    result.push(port)
  }

  return result
}

function clampPort(value: number) {
  if (!Number.isFinite(value)) {
    return MIN_DYNAMIC_PORT
  }

  return Math.min(MAX_PORT, Math.max(MIN_DYNAMIC_PORT, Math.trunc(value)))
}

function randomInt(min: number, max: number) {
  const range = max - min + 1
  const limit = Math.floor(0x100000000 / range) * range
  const buffer = new Uint32Array(1)

  while (true) {
    globalThis.crypto.getRandomValues(buffer)
    const value = buffer[0]!
    if (value < limit) {
      return min + value % range
    }
  }
}
