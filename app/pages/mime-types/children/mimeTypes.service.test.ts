import { describe, expect, it } from 'vitest'
import { normalizeQuery, searchMimeTypes } from './mimeTypes.service'

describe('mimeTypes.service', () => {
  it('按扩展名查询 MIME', () => {
    expect(searchMimeTypes('.json')).toContainEqual({ extension: 'json', mime: 'application/json', category: 'Data' })
  })

  it('按 MIME 片段反查扩展名', () => {
    expect(searchMimeTypes('image/jpeg').map(item => item.extension)).toEqual(['jpg', 'jpeg'])
  })

  it('支持分类查询和查询归一化', () => {
    expect(normalizeQuery(' .PNG ')).toBe('png')
    expect(searchMimeTypes('document').some(item => item.extension === 'pdf')).toBe(true)
  })
})
