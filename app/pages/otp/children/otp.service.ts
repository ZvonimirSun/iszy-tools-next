const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export interface TotpOptions {
  secret: string
  timestamp?: number
  period?: number
  digits?: number
  algorithm?: 'SHA-1' | 'SHA-256' | 'SHA-512'
  steam?: boolean
}

export async function generateTotp(options: TotpOptions) {
  const period = options.steam ? 30 : options.period ?? 30
  const digits = options.digits ?? 6
  if (!Number.isInteger(period) || period <= 0 || ![6, 8].includes(digits)) {
    throw new Error('周期必须是正整数，验证码位数必须为 6 或 8')
  }
  const timestamp = options.timestamp ?? Date.now()
  const counter = Math.floor(timestamp / 1000 / period)
  const secret = decodeBase32(options.secret)
  if (!secret.length) {
    throw new Error('Secret 不能为空')
  }
  const digest = await hmac(secret, counter, options.steam ? 'SHA-1' : options.algorithm ?? 'SHA-1')
  const offset = digest[digest.length - 1]! & 0x0F
  const binary = ((digest[offset]! & 0x7F) << 24)
    | (digest[offset + 1]! << 16)
    | (digest[offset + 2]! << 8)
    | digest[offset + 3]!
  // Same character order as Bitwarden SDK (used by Vaultwarden Web Vault):
  // https://github.com/bitwarden/sdk-internal/blob/main/crates/bitwarden-vault/src/totp.rs
  let token = ''
  if (options.steam) {
    const alphabet = '23456789BCDFGHJKMNPQRTVWXY'
    let value = binary
    for (let index = 0; index < 5; index += 1) {
      token += alphabet[value % alphabet.length]
      value = Math.floor(value / alphabet.length)
    }
  }
  else {
    token = String(binary % 10 ** digits).padStart(digits, '0')
  }

  return {
    token,
    counter,
    remainingSeconds: period - Math.floor(timestamp / 1000) % period,
  }
}

export async function verifyTotp(token: string, options: TotpOptions & { window?: number }) {
  const window = options.window ?? 1
  const timestamp = options.timestamp ?? Date.now()
  const period = options.period ?? 30

  for (let offset = -window; offset <= window; offset += 1) {
    const result = await generateTotp({
      ...options,
      timestamp: timestamp + offset * period * 1000,
    })

    if (result.token === token.trim()) {
      return true
    }
  }

  return false
}

export function generateBase32Secret(byteLength = 20) {
  const bytes = new Uint8Array(byteLength)
  globalThis.crypto.getRandomValues(bytes)
  return encodeBase32(bytes)
}

export function createOtpAuthUri(options: {
  secret: string
  issuer: string
  account: string
  period: number
  digits: number
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512'
}) {
  const label = `${options.issuer}:${options.account}`
  const params = new URLSearchParams({
    secret: normalizeBase32(options.secret),
    issuer: options.issuer,
    period: String(options.period),
    digits: String(options.digits),
    algorithm: options.algorithm.replace('-', ''),
  })

  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`
}

export function encodeBase32(bytes: Uint8Array) {
  let bits = 0
  let bitLength = 0
  let result = ''

  for (const byte of bytes) {
    bits = (bits << 8) | byte
    bitLength += 8

    while (bitLength >= 5) {
      bitLength -= 5
      result += BASE32_ALPHABET[(bits >> bitLength) & 31]
    }
  }

  if (bitLength > 0) {
    result += BASE32_ALPHABET[(bits << (5 - bitLength)) & 31]
  }

  return result
}

export function decodeBase32(value: string) {
  const normalized = normalizeBase32(value)
  let bits = 0
  let bitLength = 0
  const bytes: number[] = []

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) {
      throw new Error('Secret 必须是合法 Base32 字符串')
    }

    bits = (bits << 5) | index
    bitLength += 5

    if (bitLength >= 8) {
      bitLength -= 8
      bytes.push((bits >> bitLength) & 0xFF)
    }
  }

  return new Uint8Array(bytes)
}

function normalizeBase32(value: string) {
  return value.replace(/\s|=/g, '').toUpperCase()
}

async function hmac(secret: Uint8Array, counter: number, algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512') {
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    toArrayBuffer(secret),
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  )
  const counterBytes = new ArrayBuffer(8)
  const view = new DataView(counterBytes)
  const high = Math.floor(counter / 0x100000000)
  const low = counter >>> 0
  view.setUint32(0, high)
  view.setUint32(4, low)
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, counterBytes)
  return new Uint8Array(signature)
}

function toArrayBuffer(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}
