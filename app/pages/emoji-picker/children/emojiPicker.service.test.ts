import { describe, expect, it } from 'vitest'
import { getEmojiCategories, searchEmojis } from './emojiPicker.service'

describe('emojiPicker.service', () => {
  it('按关键词搜索 emoji', () => {
    expect(searchEmojis('rocket').map(item => item.emoji)).toEqual(['🚀'])
    expect(searchEmojis('赞').map(item => item.emoji)).toEqual(['👍'])
  })

  it('按分类过滤', () => {
    expect(searchEmojis('', '手势').every(item => item.category === '手势')).toBe(true)
  })

  it('返回分类列表', () => {
    expect(getEmojiCategories()).toContain('全部')
    expect(getEmojiCategories()).toContain('表情')
  })
})
