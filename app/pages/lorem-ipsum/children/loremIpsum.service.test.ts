import { describe, expect, it } from 'vitest'
import { generateLoremIpsum } from './loremIpsum.service'

describe('loremIpsum.service', () => {
  it('按配置生成段落和句子，并默认以 Lorem ipsum 开头', () => {
    const text = generateLoremIpsum({ paragraphs: 2, sentencesPerParagraph: 2, wordsPerSentence: 4 })

    expect(text.split('\n\n')).toHaveLength(2)
    expect(text.match(/\./g)).toHaveLength(4)
    expect(text.startsWith('Lorem ipsum dolor sit amet')).toBe(true)
  })

  it('限制数量范围', () => {
    const text = generateLoremIpsum({
      paragraphs: 0,
      sentencesPerParagraph: 0,
      wordsPerSentence: 1,
      startWithLoremIpsum: false,
    })

    expect(text.split(' ')).toHaveLength(1)
  })

  it('支持范围配置和 HTML 段落输出', () => {
    const text = generateLoremIpsum({
      paragraphs: 2,
      sentencesPerParagraph: [1, 1],
      wordsPerSentence: [1, 1],
      startWithLoremIpsum: false,
      asHtml: true,
    })

    expect(text).toMatch(/^<p>.+\.<\/p>\n\n<p>.+\.<\/p>$/)
  })
})
