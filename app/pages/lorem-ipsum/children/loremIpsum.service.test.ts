import { describe, expect, it } from 'vitest'
import { generateLoremIpsum } from './loremIpsum.service'

describe('loremIpsum.service', () => {
  it('按配置生成段落和句子', () => {
    const text = generateLoremIpsum({ paragraphs: 2, sentencesPerParagraph: 2, wordsPerSentence: 4 })

    expect(text.split('\n\n')).toHaveLength(2)
    expect(text.match(/\./g)).toHaveLength(4)
  })

  it('限制数量范围', () => {
    const text = generateLoremIpsum({ paragraphs: 0, sentencesPerParagraph: 0, wordsPerSentence: 1 })

    expect(text.split(' ')).toHaveLength(3)
  })
})
