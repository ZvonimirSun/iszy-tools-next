import { describe, expect, it } from 'vitest'
import { createUlid, encodeTime, generateUlids } from './ulid.service'

describe('ulid.service', () => {
  it('编码 48 位时间戳为 10 位 Crockford Base32', () => {
    expect(encodeTime(0)).toBe('0000000000')
    expect(encodeTime(1)).toBe('0000000001')
  })

  it('生成 26 位 ULID', () => {
    const ulid = createUlid(0, new Uint8Array(10))

    expect(ulid).toBe('00000000000000000000000000')
    expect(ulid).toHaveLength(26)
  })

  it('支持批量生成和小写输出', () => {
    const ulids = generateUlids({ count: 2, lowercase: true, timestamp: 0 })

    expect(ulids).toHaveLength(2)
    expect(ulids.every(ulid => /^[0-9a-z]{26}$/.test(ulid))).toBe(true)
  })
})
