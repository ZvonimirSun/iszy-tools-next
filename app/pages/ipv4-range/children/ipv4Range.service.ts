export interface Ipv4RangeResult {
  start: string
  end: string
  total: number
  cidrs: string[]
  preview: string[]
  truncated: boolean
}

export function calculateIpv4Range(startInput: string, endInput: string, previewLimit = 256): Ipv4RangeResult {
  const startInteger = parseIpv4(startInput)
  const endInteger = parseIpv4(endInput)
  const start = Math.min(startInteger, endInteger)
  const end = Math.max(startInteger, endInteger)
  const total = end - start + 1
  const safePreviewLimit = Math.min(4096, Math.max(0, Math.trunc(previewLimit)))

  return {
    start: formatIpv4(start),
    end: formatIpv4(end),
    total,
    cidrs: rangeToCidrs(start, end),
    preview: Array.from({ length: Math.min(total, safePreviewLimit) }, (_, index) => formatIpv4(start + index)),
    truncated: total > safePreviewLimit,
  }
}

export function parseIpv4(input: string) {
  const parts = input.trim().split('.')
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

function rangeToCidrs(start: number, end: number) {
  const cidrs: string[] = []
  let current = start

  while (current <= end) {
    const maxSize = current === 0 ? 0x100000000 : leastSignificantBit(current)
    const remaining = end - current + 1
    let blockSize = maxSize

    while (blockSize > remaining) {
      blockSize /= 2
    }

    const prefix = 32 - Math.log2(blockSize)
    cidrs.push(`${formatIpv4(current)}/${prefix}`)
    current += blockSize
  }

  return cidrs
}

function leastSignificantBit(value: number) {
  return value & -value
}

function formatIpv4(value: number) {
  return [
    (value >>> 24) & 0xFF,
    (value >>> 16) & 0xFF,
    (value >>> 8) & 0xFF,
    value & 0xFF,
  ].join('.')
}
