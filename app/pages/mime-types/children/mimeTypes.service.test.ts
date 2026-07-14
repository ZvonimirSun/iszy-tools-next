import { describe, expect, it } from 'vitest'
import { extensionInfos, mimeInfos, normalizeQuery, searchExtensions, searchMimeTypes } from './mimeTypes.service'

describe('mimeTypes.service', () => {
  it('加载完整 mime-types 数据库', () => {
    expect(mimeInfos.length).toBeGreaterThan(1000)
    expect(extensionInfos.length).toBeGreaterThan(1000)
  })

  it('按扩展名查询 MIME', () => {
    expect(searchExtensions('.json')).toContainEqual({ extension: 'json', mime: 'application/json' })
  })

  it('按 MIME 片段反查扩展名', () => {
    expect(searchMimeTypes('image/jpeg')[0]?.extensions).toEqual(expect.arrayContaining(['jpeg', 'jpg']))
  })

  it('支持分类查询和查询归一化', () => {
    expect(normalizeQuery(' .PNG ')).toBe('png')
    expect(searchExtensions('application/pdf').some(item => item.extension === 'pdf')).toBe(true)
  })
})
