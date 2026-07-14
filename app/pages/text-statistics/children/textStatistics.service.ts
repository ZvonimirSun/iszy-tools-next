export interface TextStatistics {
  characters: number
  codePoints: number
  words: number
  lines: number
  sentences: number
  bytes: number
  readingMinutes: number
}

const WORD_REGEX = /[\p{L}\p{N}_]+/gu
const SENTENCE_REGEX = /[^.!?。！？]+[.!?。！？]?/gu

export function analyzeText(value: string): TextStatistics {
  const words = value.match(WORD_REGEX)?.length ?? 0
  const sentences = value
    .match(SENTENCE_REGEX)
    ?.map(sentence => sentence.trim())
    .filter(Boolean).length ?? 0

  return {
    characters: value.length,
    codePoints: [...value].length,
    words,
    lines: value ? value.split(/\r\n|\r|\n/).length : 0,
    sentences,
    bytes: new TextEncoder().encode(value).byteLength,
    readingMinutes: words / 200,
  }
}

export function formatReadingTime(minutes: number) {
  if (minutes <= 0) {
    return '0 分钟'
  }

  if (minutes < 1) {
    return '小于 1 分钟'
  }

  return `${Math.ceil(minutes)} 分钟`
}
