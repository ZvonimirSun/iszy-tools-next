import { describe, expect, it } from 'vitest'
import { convertJsonToCsv } from './jsonCsv.service'

describe('jsonCsv.service', () => {
  it('将对象数组转换为 CSV 并推断字段', () => {
    const result = convertJsonToCsv('[{"name":"Alice","age":18},{"name":"Bob","city":"Paris"}]')

    expect(result.fields).toEqual(['name', 'age', 'city'])
    expect(result.csv).toBe('name,age,city\nAlice,18,\nBob,,Paris')
  })

  it('展开嵌套对象并序列化数组', () => {
    const result = convertJsonToCsv('[{"user":{"name":"Alice"},"tags":["a","b"]}]')

    expect(result.fields).toEqual(['user.name', 'tags'])
    expect(result.csv).toBe('user.name,tags\nAlice,"[""a"",""b""]"')
  })

  it('正确转义逗号、换行和引号', () => {
    const result = convertJsonToCsv('[{"text":"a,b\\n\\"c\\""}]')

    expect(result.csv).toBe('text\n"a,b\n""c"""')
  })

  it('拒绝非对象数组', () => {
    expect(() => convertJsonToCsv('[1,2,3]')).toThrow('JSON 数组中的每一项都必须是对象')
    expect(() => convertJsonToCsv('"text"')).toThrow('请输入 JSON 对象或对象数组')
  })
})
