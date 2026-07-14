const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export interface UlidOptions {
  count: number
  lowercase?: boolean
  timestamp?: number
}

export function generateUlids(options: UlidOptions) {
  const count = Math.min(1000, Math.max(1, Math.trunc(options.count)))
  return Array.from({ length: count }, () => {
    const ulid = createUlid(options.timestamp ?? Date.now())
    return options.lowercase ? ulid.toLowerCase() : ulid
  })
}

export function createUlid(timestamp: number, randomBytes = createRandomBytes(10)) {
  return `${encodeTime(timestamp)}${encodeRandom(randomBytes)}`
}

export function encodeTime(timestamp: number) {
  if (!Number.isInteger(timestamp) || timestamp < 0 || timestamp > 0xFFFFFFFFFFFF) {
    throw new RangeError('ULID 时间戳必须是 0 到 2^48-1 之间的整数')
  }

  let value = timestamp
  let result = ''
  for (let index = 0; index < 10; index += 1) {
    result = ULID_ALPHABET[value % 32]! + result
    value = Math.floor(value / 32)
  }

  return result
}

function encodeRandom(bytes: Uint8Array) {
  if (bytes.length !== 10) {
    throw new RangeError('ULID 随机部分需要 10 字节')
  }

  let bits = 0
  let bitLength = 0
  let result = ''

  for (const byte of bytes) {
    bits = (bits << 8) | byte
    bitLength += 8

    while (bitLength >= 5) {
      bitLength -= 5
      result += ULID_ALPHABET[(bits >> bitLength) & 31]
    }
  }

  return result
}

function createRandomBytes(length: number) {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}
