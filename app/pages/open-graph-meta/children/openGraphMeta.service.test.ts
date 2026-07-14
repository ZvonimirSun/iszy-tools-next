import { describe, expect, it } from 'vitest'
import {
  createDefaultOpenGraphMetaInput,
  createMetadata,
  generateOpenGraphMeta,
  getOpenGraphSections,
  splitList,
} from './openGraphMeta.service'

describe('openGraphMeta.service', () => {
  it('生成 Open Graph 和 Twitter meta 标签', () => {
    const html = generateOpenGraphMeta(createDefaultOpenGraphMetaInput())

    expect(html).toContain('property="og:title" value="ISZY Tools"')
    expect(html).toContain('property="og:image:alt" value="ISZY Tools preview"')
    expect(html).toContain('name="twitter:card" value="summary_large_image"')
    expect(html).toContain('name="twitter:image:alt" value="ISZY Tools preview"')
  })

  it('支持 article schema 和逗号列表字段', () => {
    const metadata = createMetadata({
      ...createDefaultOpenGraphMetaInput(),
      'type': 'article',
      'article:author': 'Alice, Bob',
      'article:tag': 'nuxt, tools',
    })

    expect(metadata['article:author']).toEqual(['Alice', 'Bob'])
    expect(metadata['article:tag']).toEqual(['nuxt', 'tools'])
  })

  it('支持 video/music 扩展类型和数字字段', () => {
    const metadata = createMetadata({
      ...createDefaultOpenGraphMetaInput(),
      'type': 'video.episode',
      'video:duration': '2700',
      'video:actor': 'Alice, Bob',
      'video:series': 'https://example.com/series',
    })

    expect(metadata.type).toBe('video.episode')
    expect(metadata['video:duration']).toBe(2700)
    expect(metadata['video:actor']).toEqual(['Alice', 'Bob'])
    expect(metadata['video:series']).toBe('https://example.com/series')
  })

  it('提供所选类型对应字段', () => {
    const sections = getOpenGraphSections('music.song')
    const fields = sections.flatMap(section => section.fields.map(field => field.key))

    expect(fields).toContain('music:musician')
    expect(fields).toContain('image:width')
    expect(fields).toContain('twitter:creator')
  })

  it('拆分逗号列表并过滤空项', () => {
    expect(splitList('a, b,, c ')).toEqual(['a', 'b', 'c'])
  })
})
