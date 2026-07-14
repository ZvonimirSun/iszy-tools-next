import emojiKeywords from 'emojilib'
import emojiUnicodeData from 'unicode-emoji-json'

interface UnicodeEmojiInfo {
  name: string
  slug: string
  group: string
  emoji_version: string
  unicode_version: string
  skin_tone_support: boolean
}

type UnicodeEmojiData = Record<string, UnicodeEmojiInfo>
type EmojiKeywordData = Record<string, string[]>

export interface EmojiItem extends UnicodeEmojiInfo {
  emoji: string
  title: string
  keywords: string[]
  codePoints: string
  unicode: string
}

const unicodeData = emojiUnicodeData as UnicodeEmojiData
const keywordData = emojiKeywords as EmojiKeywordData

export const emojiItems: EmojiItem[] = Object.entries(unicodeData).map(([emoji, info]) => ({
  ...info,
  emoji,
  title: toTitle(info.name),
  keywords: keywordData[emoji] ?? [],
  codePoints: getEmojiCodePoints(emoji),
  unicode: getEmojiUnicodeEscapes(emoji),
}))

export function searchEmojis(query: string, category = '全部') {
  const keyword = query.trim().toLowerCase()

  return emojiItems.filter((item) => {
    const categoryMatched = category === '全部' || item.group === category
    if (!categoryMatched) {
      return false
    }

    if (!keyword) {
      return true
    }

    return [
      item.emoji,
      item.name,
      item.title,
      item.slug,
      item.group,
      item.codePoints,
      item.unicode,
      ...item.keywords,
    ].some(value => value.toLowerCase().includes(keyword))
  })
}

export function getEmojiCategories() {
  return ['全部', ...Array.from(new Set(emojiItems.map(item => item.group)))]
}

export function getEmojiCodePoints(emoji: string) {
  return Array.from(emoji)
    .map(char => `0x${char.codePointAt(0)!.toString(16).toUpperCase()}`)
    .join(' ')
}

export function getEmojiUnicodeEscapes(emoji: string) {
  return emoji
    .split('')
    .map((unit) => {
      const code = unit.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase()
      return `\\u${code}`
    })
    .join('')
}

function toTitle(value: string) {
  return value
    .split(' ')
    .map(word => word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word)
    .join(' ')
}
