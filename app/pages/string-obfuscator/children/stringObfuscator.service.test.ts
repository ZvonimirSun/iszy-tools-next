import { describe, expect, it } from 'vitest'
import { obfuscateString } from './stringObfuscator.service'

describe('stringObfuscator.service', () => {
  it('保留前后字符并遮罩中间内容', () => {
    expect(obfuscateString('abcdef', { keepStart: 2, keepEnd: 1, maskChar: '*', perLine: false })).toBe('ab***f')
  })

  it('短文本完全遮罩', () => {
    expect(obfuscateString('abc', { keepStart: 2, keepEnd: 2, maskChar: '#', perLine: false })).toBe('###')
  })

  it('支持逐行处理和 Unicode 字符', () => {
    expect(obfuscateString('用户123\nsecret', { keepStart: 1, keepEnd: 1, maskChar: '•', perLine: true })).toBe('用•••3\ns••••t')
  })
})
