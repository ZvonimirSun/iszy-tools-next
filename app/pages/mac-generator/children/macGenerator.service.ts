export interface MacGeneratorOptions {
  prefix: string
  count: number
  uppercase: boolean
  separator: ':' | '-' | ''
  locallyAdministered: boolean
}

export function generateMacAddresses(options: MacGeneratorOptions) {
  const count = Math.min(1000, Math.max(1, Math.trunc(options.count)))
  const prefixBytes = parseMacPrefix(options.prefix)

  return Array.from({ length: count }, () => {
    const bytes = new Uint8Array(6)
    globalThis.crypto.getRandomValues(bytes)
    bytes.set(prefixBytes)

    if (options.locallyAdministered && prefixBytes.length === 0) {
      bytes[0] = (bytes[0]! | 0b00000010) & 0b11111110
    }

    return formatMac(bytes, options.separator, options.uppercase)
  })
}

export function parseMacPrefix(prefix: string) {
  const normalized = prefix.trim().replace(/[-:\s]/g, '')
  if (!normalized) {
    return new Uint8Array()
  }

  if (!/^[\da-f]+$/i.test(normalized) || normalized.length % 2 !== 0 || normalized.length > 12) {
    throw new Error('MAC 前缀必须是偶数位十六进制，最多 6 字节')
  }

  return Uint8Array.from(normalized.match(/.{2}/g)!.map(hex => Number.parseInt(hex, 16)))
}

function formatMac(bytes: Uint8Array, separator: ':' | '-' | '', uppercase: boolean) {
  const parts = Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0'))
  const value = parts.join(separator)
  return uppercase ? value.toUpperCase() : value.toLowerCase()
}
