import { describe, expect, it } from 'vitest'
import { calculateIpv4Range, parseIpv4 } from './ipv4Range.service'

describe('ipv4Range.service', () => {
  it('将 IPv4 起止范围转换为 CIDR 列表', () => {
    const result = calculateIpv4Range('192.168.1.0', '192.168.1.15')

    expect(result.start).toBe('192.168.1.0')
    expect(result.end).toBe('192.168.1.15')
    expect(result.total).toBe(16)
    expect(result.cidrs).toEqual(['192.168.1.0/28'])
  })

  it('支持反向输入并限制预览数量', () => {
    const result = calculateIpv4Range('10.0.0.10', '10.0.0.1', 3)

    expect(result.start).toBe('10.0.0.1')
    expect(result.end).toBe('10.0.0.10')
    expect(result.preview).toEqual(['10.0.0.1', '10.0.0.2', '10.0.0.3'])
    expect(result.truncated).toBe(true)
  })

  it('拆分非对齐范围', () => {
    const result = calculateIpv4Range('192.168.1.1', '192.168.1.6')

    expect(result.cidrs).toEqual([
      '192.168.1.1/32',
      '192.168.1.2/31',
      '192.168.1.4/31',
      '192.168.1.6/32',
    ])
  })

  it('拒绝非法 IPv4', () => {
    expect(() => parseIpv4('1.2.3')).toThrow('IPv4 地址必须包含 4 段')
    expect(() => parseIpv4('1.2.3.256')).toThrow('IPv4 每段必须是 0 到 255 的整数')
  })
})
