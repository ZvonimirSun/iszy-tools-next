import { describe, expect, it } from 'vitest'
import { generateMacAddresses, parseMacPrefix } from './macGenerator.service'

describe('macGenerator.service', () => {
  it('解析 MAC 前缀', () => {
    expect(Array.from(parseMacPrefix('AA:BB:CC'))).toEqual([0xAA, 0xBB, 0xCC])
    expect(Array.from(parseMacPrefix('aa-bb'))).toEqual([0xAA, 0xBB])
  })

  it('生成指定前缀和格式的 MAC 地址', () => {
    const macs = generateMacAddresses({
      prefix: 'aa:bb:cc',
      count: 3,
      uppercase: true,
      separator: '-',
      locallyAdministered: false,
    })

    expect(macs).toHaveLength(3)
    expect(macs.every(mac => /^AA-BB-CC-[0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2}$/.test(mac))).toBe(true)
  })

  it('本地管理地址会设置 local 位并清除 multicast 位', () => {
    const mac = generateMacAddresses({
      prefix: '',
      count: 1,
      uppercase: false,
      separator: '',
      locallyAdministered: true,
    })[0]!

    const firstByte = Number.parseInt(mac.slice(0, 2), 16)
    expect(firstByte & 0b00000010).toBe(0b00000010)
    expect(firstByte & 0b00000001).toBe(0)
  })

  it('拒绝非法前缀', () => {
    expect(() => parseMacPrefix('abc')).toThrow('MAC 前缀必须是偶数位十六进制，最多 6 字节')
    expect(() => parseMacPrefix('zz')).toThrow('MAC 前缀必须是偶数位十六进制，最多 6 字节')
  })
})
