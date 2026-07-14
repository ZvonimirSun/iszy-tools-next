export interface EmojiItem {
  emoji: string
  name: string
  category: string
  keywords: string[]
}

export const emojiItems: EmojiItem[] = [
  { emoji: '😀', name: 'grinning face', category: '表情', keywords: ['happy', 'smile', '开心'] },
  { emoji: '😂', name: 'face with tears of joy', category: '表情', keywords: ['laugh', 'joy', '笑'] },
  { emoji: '😍', name: 'smiling face with heart-eyes', category: '表情', keywords: ['love', 'heart', '喜欢'] },
  { emoji: '🤔', name: 'thinking face', category: '表情', keywords: ['think', '思考'] },
  { emoji: '👍', name: 'thumbs up', category: '手势', keywords: ['ok', 'good', '赞'] },
  { emoji: '👏', name: 'clapping hands', category: '手势', keywords: ['clap', '鼓掌'] },
  { emoji: '🙏', name: 'folded hands', category: '手势', keywords: ['thanks', 'please', '感谢'] },
  { emoji: '🚀', name: 'rocket', category: '物品', keywords: ['ship', 'launch', '火箭'] },
  { emoji: '💡', name: 'light bulb', category: '物品', keywords: ['idea', 'light', '灵感'] },
  { emoji: '🔥', name: 'fire', category: '符号', keywords: ['hot', 'trend', '火'] },
  { emoji: '✅', name: 'check mark button', category: '符号', keywords: ['done', 'check', '完成'] },
  { emoji: '⚠️', name: 'warning', category: '符号', keywords: ['warn', 'alert', '警告'] },
  { emoji: '❤️', name: 'red heart', category: '符号', keywords: ['love', 'heart', '爱'] },
  { emoji: '⭐', name: 'star', category: '符号', keywords: ['favorite', 'star', '星'] },
  { emoji: '📌', name: 'pushpin', category: '物品', keywords: ['pin', 'mark', '标记'] },
  { emoji: '📎', name: 'paperclip', category: '物品', keywords: ['attach', 'file', '附件'] },
  { emoji: '🧪', name: 'test tube', category: '物品', keywords: ['test', 'lab', '测试'] },
  { emoji: '🛠️', name: 'hammer and wrench', category: '物品', keywords: ['tool', 'fix', '工具'] },
]

export function searchEmojis(query: string, category = '全部') {
  const keyword = query.trim().toLowerCase()
  return emojiItems.filter((item) => {
    const categoryMatched = category === '全部' || item.category === category
    const keywordMatched = !keyword
      || item.emoji.includes(keyword)
      || item.name.includes(keyword)
      || item.keywords.some(value => value.toLowerCase().includes(keyword))

    return categoryMatched && keywordMatched
  })
}

export function getEmojiCategories() {
  return ['全部', ...Array.from(new Set(emojiItems.map(item => item.category)))]
}
