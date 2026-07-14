import { describe, expect, it } from 'vitest'
import { emojiItems, getEmojiCategories, getEmojiCodePoints, getEmojiUnicodeEscapes, searchEmojis } from './emojiPicker.service'

describe('emojiPicker.service', () => {
  it('加载完整 emoji 数据集', () => {
    expect(emojiItems.length).toBeGreaterThan(1000)
    expect(emojiItems.some(item => item.emoji === '😀' && item.name === 'grinning face')).toBe(true)
  })

  it('按关键词搜索 emoji', () => {
    const rocketResults = searchEmojis('rocket').map(item => item.emoji)
    expect(rocketResults).toContain('🚀')
    expect(rocketResults.length).toBeGreaterThan(1)
    expect(searchEmojis('grinning_face').map(item => item.emoji)).toContain('😀')
  })

  it('按分类过滤', () => {
    expect(searchEmojis('', 'Smileys & Emotion').every(item => item.group === 'Smileys & Emotion')).toBe(true)
  })

  it('返回分类列表', () => {
    expect(getEmojiCategories()).toContain('全部')
    expect(getEmojiCategories()).toContain('Smileys & Emotion')
  })

  it('生成 code point 和 unicode escape 信息', () => {
    expect(getEmojiCodePoints('😀')).toBe('0x1F600')
    expect(getEmojiUnicodeEscapes('😀')).toBe('\\uD83D\\uDE00')
  })
})
