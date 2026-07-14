import { describe, expect, it } from 'vitest'
import { convertIpv4, parseIpv4Input } from './ipv4Converter.service'

describe('ipv4Converter.service', () => {
  it('转换点分十进制 IPv4', () => {
    expect(convertIpv4('192.168.1.1')).toEqual({
      decimal: '192.168.1.1',
      integer: 3232235777,
      hexadecimal: '0xC0A80101',
      binary: '11000000.10101000.00000001.00000001',
      ipv6Mapped: '::ffff:192.168.1.1',
    })
  })

  it('解析整数、十六进制和二进制输入', () => {
    expect(parseIpv4Input('3232235777')).toBe(3232235777)
    expect(parseIpv4Input('0xC0A80101')).toBe(3232235777)
    expect(parseIpv4Input('11000000101010000000000100000001')).toBe(3232235777)
  })

  it('拒绝非法 IPv4 输入', () => {
    expect(() => parseIpv4Input('256.1.1.1')).toThrow('IPv4 每段必须是 0 到 255 的整数')
    expect(() => parseIpv4Input('4294967296')).toThrow('IPv4 整数必须在 0 到 4294967295 之间')
  })
})
