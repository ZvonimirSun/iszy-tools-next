import { describe, expect, it } from 'vitest'
import { convertChineseId15To18, parseChineseIdCard, verifyChineseIdCheckCode } from './idChinese.service'

describe('idChinese.service', () => {
  it('可解析合法 18 位身份证并返回完整信息', () => {
    const result = parseChineseIdCard('11010519491231002X', new Date('2026-04-16T00:00:00Z'))

    expect(result.valid).toBe(true)
    expect(result.sourceType).toBe('18')
    expect(result.gender).toBe('女')
    expect(result.addressCode).toBe('110105')
    expect(result.region?.provinceName).toBe('北京市')
    expect(result.region?.districtName).toBe('朝阳区')
    expect(result.birth?.formatted).toBe('1949-12-31')
    expect(result.birth?.zodiac).toBe('牛')
    expect(result.birth?.constellation).toBe('摩羯座')
    expect(result.checksumValid).toBe(true)
  })

  it('支持 15 位身份证转 18 位并继续解析', () => {
    const result = parseChineseIdCard('130503670401001', new Date('2026-04-16T00:00:00Z'))

    expect(result.sourceType).toBe('15')
    expect(result.id18).toBe(convertChineseId15To18('130503670401001'))
    expect(result.gender).toBe('男')
    expect(result.birth?.formatted).toBe('1967-04-01')
  })

  it('能检测非法校验位', () => {
    const result = parseChineseIdCard('110105194912310021', new Date('2026-04-16T00:00:00Z'))

    expect(result.valid).toBe(false)
    expect(result.checksumValid).toBe(false)
    expect(result.errors.some(error => error.includes('校验位错误'))).toBe(true)
  })

  it('能检测非法出生日期', () => {
    const result = parseChineseIdCard('11010519990230002X', new Date('2026-04-16T00:00:00Z'))

    expect(result.valid).toBe(false)
    expect(result.birth).toBeNull()
    expect(result.errors.some(error => error.includes('出生日期无效'))).toBe(true)
  })

  it('verifyChineseIdCheckCode 对格式和校验位同时生效', () => {
    expect(verifyChineseIdCheckCode('11010519491231002X')).toBe(true)
    expect(verifyChineseIdCheckCode('110105194912310021')).toBe(false)
    expect(verifyChineseIdCheckCode('123')).toBe(false)
  })
})
