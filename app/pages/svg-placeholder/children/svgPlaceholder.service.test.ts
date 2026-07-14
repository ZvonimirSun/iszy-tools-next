import { describe, expect, it } from 'vitest'
import { createSvgBase64DataUrl, createSvgDataUrl, createSvgPlaceholder } from './svgPlaceholder.service'

describe('svgPlaceholder.service', () => {
  it('生成 SVG 占位图', () => {
    const svg = createSvgPlaceholder({
      width: 320,
      height: 180,
      text: 'Preview',
      background: '#eeeeee',
      foreground: '#111111',
      fontSize: 24,
    })

    expect(svg).toContain('width="320"')
    expect(svg).toContain('height="180"')
    expect(svg).toContain('font-size="24"')
    expect(svg).toContain('Preview')
  })

  it('转义文本和生成 data URL', () => {
    const svg = createSvgPlaceholder({ width: 1, height: 1, text: '<x&y>', background: '#fff', foreground: '#000' })

    expect(svg).toContain('&lt;x&amp;y&gt;')
    expect(createSvgDataUrl(svg)).toContain('data:image/svg+xml')
  })

  it('支持省略 exact size 和生成 base64 data URL', () => {
    const svg = createSvgPlaceholder({
      width: 320,
      height: 180,
      text: '',
      background: '#fff',
      foreground: '#000',
      exactSize: false,
    })

    expect(svg).not.toContain('width="320" height="180"')
    expect(svg).toContain('viewBox="0 0 320 180"')
    expect(createSvgBase64DataUrl(svg)).toContain('data:image/svg+xml;base64,')
  })
})
