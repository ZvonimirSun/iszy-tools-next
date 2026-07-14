import { describe, expect, it } from 'vitest'
import { httpStatusCodes, searchHttpStatusCodes } from './httpStatusCodes.service'

describe('httpStatusCodes.service', () => {
  it('包含常用 HTTP 状态码', () => {
    expect(httpStatusCodes.some(status => status.code === 200 && status.phrase === 'OK')).toBe(true)
    expect(httpStatusCodes.some(status => status.code === 306 && status.phrase === 'Switch Proxy')).toBe(true)
    expect(httpStatusCodes.some(status => status.code === 404 && status.phrase === 'Not Found')).toBe(true)
    expect(httpStatusCodes.some(status => status.code === 500 && status.phrase === 'Internal Server Error')).toBe(true)
  })

  it('可按状态码、英文短语、中文说明和类型搜索', () => {
    expect(searchHttpStatusCodes('404').flatMap(group => group.codes).map(status => status.code)).toEqual([404])
    expect(searchHttpStatusCodes('gateway').flatMap(group => group.codes).map(status => status.code)).toEqual([502, 504])
    expect(searchHttpStatusCodes('限流').flatMap(group => group.codes).map(status => status.code)).toEqual([429])
    expect(searchHttpStatusCodes('webdav').flatMap(group => group.codes).map(status => status.code)).toEqual([
      102,
      207,
      208,
      423,
      424,
      507,
      508,
    ])
  })

  it('空查询返回完整分组', () => {
    expect(searchHttpStatusCodes('')).toHaveLength(5)
  })
})
