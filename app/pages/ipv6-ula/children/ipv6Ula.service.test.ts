import { describe, expect, it } from 'vitest'
import { createIpv6Ula, generateIpv6UlaFromMac } from './ipv6Ula.service'

describe('ipv6Ula.service', () => {
  it('根据 40 位 Global ID 生成 ULA /48 前缀和 /64 子网', () => {
    const result = createIpv6Ula(new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9A]), 3)

    expect(result.globalId).toBe('123456789A')
    expect(result.prefix).toBe('fd12:3456:789a::/48')
    expect(result.firstRoutableBlock).toBe('fd12:3456:789a:0::/64')
    expect(result.lastRoutableBlock).toBe('fd12:3456:789a:ffff::/64')
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

  it('支持 MAC 地址加时间戳生成 RFC4193 Global ID', () => {
    const result = generateIpv6UlaFromMac('20:37:06:12:34:56', 0, 1)

    expect(result.globalId).toBe('A85B32B6F9')
    expect(result.prefix).toBe('fda8:5b32:b6f9::/48')
  })

  it('拒绝非法 MAC 地址', () => {
    expect(() => generateIpv6UlaFromMac('invalid', 0)).toThrow('请输入合法的 MAC 地址')
  })
})
