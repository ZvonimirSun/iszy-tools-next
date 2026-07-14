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

const FIRST_SENTENCE = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'

export interface LoremOptions {
  paragraphs: number
  sentencesPerParagraph: number | [number, number]
  wordsPerSentence: number | [number, number]
  startWithLoremIpsum?: boolean
  asHtml?: boolean
}

export function generateLoremIpsum(options: LoremOptions) {
  const paragraphs = clamp(options.paragraphs, 1, 50)

  const paragraphTexts = Array.from({ length: paragraphs }, (_, paragraphIndex) => {
    const sentenceCount = normalizeRangeValue(options.sentencesPerParagraph, 1, 50)
    const sentences = Array.from({ length: sentenceCount }, (_, sentenceIndex) => {
      if (options.startWithLoremIpsum !== false && paragraphIndex === 0 && sentenceIndex === 0) {
        return FIRST_SENTENCE
      }

      return createSentence(normalizeRangeValue(options.wordsPerSentence, 1, 50))
    })

    return sentences.join(' ')
  })

  if (options.asHtml) {
    return `<p>${paragraphTexts.join('</p>\n\n<p>')}</p>`
  }

  return paragraphTexts.join('\n\n')
}

function createSentence(length: number) {
  const words = Array.from({ length }, () => WORDS[randomInt(0, WORDS.length - 1)]!)
  words[0] = capitalize(words[0]!)
  return `${words.join(' ')}.`
}

function normalizeRangeValue(value: number | [number, number], min: number, max: number) {
  if (Array.isArray(value)) {
    const rangeMin = clamp(value[0], min, max)
    const rangeMax = clamp(value[1], min, max)
    return randomInt(Math.min(rangeMin, rangeMax), Math.max(rangeMin, rangeMax))
  }

  return clamp(value, min, max)
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

function randomInt(min: number, max: number) {
  const range = max - min + 1
  const limit = Math.floor(0x100000000 / range) * range
  const buffer = new Uint32Array(1)

  while (true) {
    globalThis.crypto.getRandomValues(buffer)
    const value = buffer[0]!
    if (value < limit) {
      return min + value % range
    }
  }
}
