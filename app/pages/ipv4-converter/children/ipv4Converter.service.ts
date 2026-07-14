export interface Ipv4ConversionResult {
  decimal: string
  integer: number
  hexadecimal: string
  binary: string
  ipv6Mapped: string
}

export function convertIpv4(input: string): Ipv4ConversionResult {
  const integer = parseIpv4Input(input)
  const decimal = formatIpv4(integer)
  const hexadecimal = `0x${integer.toString(16).toUpperCase().padStart(8, '0')}`
  const binary = formatBinary(integer)

  return {
    decimal,
    integer,
    hexadecimal,
    binary,
    ipv6Mapped: `::ffff:${decimal}`,
  }
}

export function parseIpv4Input(input: string) {
  const value = input.trim()
  if (!value) {
    throw new Error('请输入 IPv4 地址、整数、十六进制或二进制')
  }

  if (value.includes('.')) {
    return parseDottedIpv4(value)
  }

  if (/^0x[\da-f]+$/i.test(value)) {
    return parseInteger(Number.parseInt(value.slice(2), 16))
  }

  if (/^[01]{32}$/.test(value.replace(/\s/g, ''))) {
    return parseInteger(Number.parseInt(value.replace(/\s/g, ''), 2))
  }

  if (/^\d+$/.test(value)) {
    return parseInteger(Number(value))
  }

  throw new Error('无法识别输入格式')
}

function parseDottedIpv4(value: string) {
  const parts = value.split('.')
  if (parts.length !== 4) {
    throw new Error('IPv4 地址必须包含 4 段')
  }

  return parts.reduce((result, part) => {
    if (!/^\d+$/.test(part)) {
      throw new Error('IPv4 每段必须是 0 到 255 的整数')
    }

    const octet = Number(part)
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      throw new Error('IPv4 每段必须是 0 到 255 的整数')
    }

    return ((result << 8) | octet) >>> 0
  }, 0)
}

function parseInteger(value: number) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xFFFFFFFF) {
    throw new Error('IPv4 整数必须在 0 到 4294967295 之间')
  }

  return value >>> 0
}

function formatIpv4(value: number) {
  return [
    (value >>> 24) & 0xFF,
    (value >>> 16) & 0xFF,
    (value >>> 8) & 0xFF,
    value & 0xFF,
  ].join('.')
}

function formatBinary(value: number) {
  return [
    (value >>> 24) & 0xFF,
    (value >>> 16) & 0xFF,
    (value >>> 8) & 0xFF,
    value & 0xFF,
  ].map(octet => octet.toString(2).padStart(8, '0')).join('.')
}
