import { describe, expect, it } from 'vitest'
import { analyzeText, formatReadingTime } from './textStatistics.service'

describe('textStatistics.service', () => {
  it('统计字符、码点、行数和字节数', () => {
    const result = analyzeText('Hi 😀\n你好')

    expect(result.characters).toBe(8)
    expect(result.codePoints).toBe(7)
    expect(result.lines).toBe(2)
    expect(result.bytes).toBe(14)
  })

  it('统计词语和句子', () => {
    const result = analyzeText('Hello world. 你好世界！')

    expect(result.words).toBe(3)
    expect(result.sentences).toBe(2)
  })

  it('格式化阅读时间', () => {
    expect(formatReadingTime(0)).toBe('0 分钟')
    expect(formatReadingTime(0.5)).toBe('小于 1 分钟')
    expect(formatReadingTime(1.2)).toBe('2 分钟')
  })
})
