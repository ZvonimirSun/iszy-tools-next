import { describe, expect, it } from 'vitest'
import { decodeHtmlEntities, encodeHtmlEntities } from './htmlEntities.service'

describe('htmlEntities.service', () => {
  it('编码 HTML 特殊字符', () => {
    expect(encodeHtmlEntities('<a title="Tom & Jerry">\'Hi\'</a>')).toBe('&lt;a title=&quot;Tom &amp; Jerry&quot;&gt;&#39;Hi&#39;&lt;/a&gt;')
  })

  it('解码常见命名实体', () => {
    expect(decodeHtmlEntities('&lt;strong&gt;Tom &amp; Jerry&lt;/strong&gt;')).toBe('<strong>Tom & Jerry</strong>')
    expect(decodeHtmlEntities('A&nbsp;B')).toBe('A\u00A0B')
  })

  it('解码数字实体并保留非法实体', () => {
    expect(decodeHtmlEntities('&#65;&#x42;&#x1F600;')).toBe('AB😀')
    expect(decodeHtmlEntities('&#x110000;&unknown;')).toBe('&#x110000;&unknown;')
  })
})
