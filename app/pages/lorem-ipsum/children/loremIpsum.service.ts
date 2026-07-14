const WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
]

export interface LoremOptions {
  paragraphs: number
  sentencesPerParagraph: number
  wordsPerSentence: number
}

export function generateLoremIpsum(options: LoremOptions) {
  const paragraphs = clamp(options.paragraphs, 1, 50)
  const sentencesPerParagraph = clamp(options.sentencesPerParagraph, 1, 20)
  const wordsPerSentence = clamp(options.wordsPerSentence, 3, 40)

  return Array.from({ length: paragraphs }, (_, paragraphIndex) =>
    Array.from({ length: sentencesPerParagraph }, (_, sentenceIndex) =>
      createSentence(wordsPerSentence, paragraphIndex * sentencesPerParagraph + sentenceIndex)).join(' ')).join('\n\n')
}

function createSentence(length: number, offset: number) {
  const words = Array.from({ length }, (_, index) => WORDS[(index + offset) % WORDS.length]!)
  words[0] = capitalize(words[0]!)
  return `${words.join(' ')}.`
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.trunc(value)))
}
