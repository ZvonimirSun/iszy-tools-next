import { describe, expect, it } from 'vitest'
import { createJsonDiffSummary, diffJson } from './jsonDiff.service'

describe('jsonDiff.service', () => {
  it('对比对象字段新增、删除和修改', () => {
    const rows = diffJson('{"name":"Alice","age":18,"old":true}', '{"name":"Alice","age":19,"city":"Paris"}')

    expect(rows).toEqual([
      { path: '$.age', kind: 'change', left: 18, right: 19 },
      { path: '$.city', kind: 'insert', left: undefined, right: 'Paris' },
      { path: '$.name', kind: 'equal', left: 'Alice', right: 'Alice' },
      { path: '$.old', kind: 'delete', left: true, right: undefined },
    ])
  })

  it('递归对比数组和嵌套对象', () => {
    const rows = diffJson('{"items":[{"id":1},{"id":2}]}', '{"items":[{"id":1},{"id":3},{"id":4}]}')

    expect(rows.map(row => [row.path, row.kind])).toEqual([
      ['$.items[0].id', 'equal'],
      ['$.items[1].id', 'change'],
      ['$.items[2]', 'insert'],
    ])
  })

  it('生成差异摘要', () => {
    const rows = diffJson('{"age":18}', '{"age":19,"city":"Paris"}')

    expect(createJsonDiffSummary(rows)).toBe('~ $.age: 18 -> 19\n+ $.city: Paris')
  })

  it('支持 JSON5 输入', () => {
    const rows = diffJson(`{
      // old value
      age: 18,
    }`, `{ age: 19 }`)

    expect(rows).toEqual([{ path: '$.age', kind: 'change', left: 18, right: 19 }])
  })
})
