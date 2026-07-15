import SHA1 from 'crypto-js/sha1'

export interface Ipv6UlaResult {
  prefix: string
  globalId: string
  subnets: string[]
  firstRoutableBlock: string
  lastRoutableBlock: string
}

export function generateIpv6Ula(subnetCount = 4): Ipv6UlaResult {
  const globalIdBytes = new Uint8Array(5)
  globalThis.crypto.getRandomValues(globalIdBytes)
  return createIpv6Ula(globalIdBytes, subnetCount)
}

export function generateIpv6UlaFromMac(macAddress: string, timestamp = Date.now(), subnetCount = 4): Ipv6UlaResult {
  if (!isValidMacAddress(macAddress)) {
    throw new Error('请输入合法的 MAC 地址')
  }

  const hash = SHA1(`${timestamp}${macAddress.trim()}`).toString()
  const globalId = hash.slice(-10)
  return createIpv6Ula(hexToBytes(globalId), subnetCount)
}

export function createIpv6Ula(globalIdBytes: Uint8Array, subnetCount = 4): Ipv6UlaResult {
  if (globalIdBytes.length !== 5) {
    throw new Error('IPv6 ULA Global ID 需要 5 字节随机数')
  }

  const hextets = [
    `fd${globalIdBytes[0]!.toString(16).padStart(2, '0')}`,
    bytesToHextet(globalIdBytes[1]!, globalIdBytes[2]!),
    bytesToHextet(globalIdBytes[3]!, globalIdBytes[4]!),
  ]
  const prefix = `${hextets.join(':')}::/48`
  const count = Math.min(256, Math.max(1, Math.trunc(subnetCount)))

  return {
    prefix,
    globalId: globalIdBytesToText(globalIdBytes),
    firstRoutableBlock: `${hextets.join(':')}:0::/64`,
    lastRoutableBlock: `${hextets.join(':')}:ffff::/64`,
    subnets: Array.from({ length: count }, (_, index) => `${hextets.join(':')}:${index.toString(16)}::/64`),
  }
}

function isValidMacAddress(value: string) {
  return /^(?:[\da-f]{2}[:-]){5}[\da-f]{2}$/i.test(value.trim())
}

function hexToBytes(value: string) {
  return Uint8Array.from(value.match(/.{2}/g)!.map(hex => Number.parseInt(hex, 16)))
}

function bytesToHextet(left: number, right: number) {
  return ((left << 8) | right).toString(16).padStart(4, '0')
}

function globalIdBytesToText(bytes: Uint8Array) {
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
}
