declare module 'unicode-emoji-json' {
  const emojiUnicodeData: Record<string, {
    name: string
    slug: string
    group: string
    emoji_version: string
    unicode_version: string
    skin_tone_support: boolean
  }>

  export default emojiUnicodeData
}
