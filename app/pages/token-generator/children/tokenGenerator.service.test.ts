import { describe, expect, it } from 'vitest'
import { createTokenCharset, generateTokens } from './tokenGenerator.service'

describe('tokenGenerator.service', () => {
  it('根据选项创建字符集', () => {
    expect(createTokenCharset({ uppercase: true, lowercase: false, numbers: true, symbols: false })).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
  })

  it('生成指定数量和长度的 token', () => {
    const tokens = generateTokens({
      length: 12,
      count: 3,
      uppercase: false,
      lowercase: true,
      numbers: true,
      symbols: false,
    })

    expect(tokens).toHaveLength(3)
    expect(tokens.every(token => token.length === 12)).toBe(true)
    expect(tokens.every(token => /^[a-z0-9]+$/.test(token))).toBe(true)
  })

  it('未选择字符集时抛出错误', () => {
    expect(() => generateTokens({
      length: 12,
      count: 1,
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: false,
    })).toThrow('请至少选择一种字符集')
  })
})
