import { describe, expect, it } from 'vitest'
import { createIpv6Ula } from './ipv6Ula.service'

describe('ipv6Ula.service', () => {
  it('根据 40 位 Global ID 生成 ULA /48 前缀和 /64 子网', () => {
    const result = createIpv6Ula(new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9A]), 3)

    expect(result.globalId).toBe('123456789A')
    expect(result.prefix).toBe('fd12:3456:789a::/48')
    expect(result.subnets).toEqual([
      'fd12:3456:789a:0::/64',
      'fd12:3456:789a:1::/64',
      'fd12:3456:789a:2::/64',
    ])
  })

  it('限制子网示例数量', () => {
    expect(createIpv6Ula(new Uint8Array(5), 999).subnets).toHaveLength(256)
    expect(createIpv6Ula(new Uint8Array(5), 0).subnets).toHaveLength(1)
  })

  it('拒绝非法 Global ID 长度', () => {
    expect(() => createIpv6Ula(new Uint8Array(4))).toThrow('IPv6 ULA Global ID 需要 5 字节随机数')
  })
})
