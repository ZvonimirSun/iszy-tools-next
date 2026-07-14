import { describe, expect, it } from 'vitest'
import { generateOpenGraphMeta } from './openGraphMeta.service'

describe('openGraphMeta.service', () => {
  it('生成 Open Graph 和 Twitter meta 标签', () => {
    const html = generateOpenGraphMeta({
      title: 'ISZY Tools',
      description: 'Online tools',
      url: 'https://example.com',
      image: 'https://example.com/og.png',
      siteName: 'ISZY',
      type: 'website',
      twitterCard: 'summary_large_image',
    })

    expect(html).toContain('property="og:title" content="ISZY Tools"')
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
  })

  it('跳过空 content 并转义 HTML', () => {
    const html = generateOpenGraphMeta({
      title: 'A "B" & <C>',
      description: '',
      url: '',
      image: '',
      siteName: '',
      type: 'website',
      twitterCard: '',
    })

    expect(html).toContain('A &quot;B&quot; &amp; &lt;C&gt;')
    expect(html).not.toContain('og:description')
  })
})
