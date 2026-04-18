import { describe, expect, it } from 'vitest'
import {
  calculateCallResult,
  calculateRelationChainResult,
  getDisabledSpouseKey,
  getTargetPronoun,
  isActiveTab,
  isSex,
  normalizeRelationshipResult,
} from './relationship.service'

describe('relationship.service', () => {
  it('isActiveTab 与 isSex 只接受合法值', () => {
    expect(isActiveTab('call')).toBe(true)
    expect(isActiveTab('relation')).toBe(true)
    expect(isActiveTab('other')).toBe(false)

    expect(isSex(0)).toBe(true)
    expect(isSex(1)).toBe(true)
    expect(isSex(2)).toBe(false)
  })

  it('夫/妻禁用依据关系链末端人物性别，而非本人性别', () => {
    expect(getDisabledSpouseKey([], 1)).toBe('夫')
    expect(getDisabledSpouseKey(['妻'], 1)).toBe('妻')
    expect(getDisabledSpouseKey(['夫'], 0)).toBe('夫')
  })

  it('按关系链末端输出目标代词', () => {
    expect(getTargetPronoun([])).toBe('TA')
    expect(getTargetPronoun(['父'])).toBe('他')
    expect(getTargetPronoun(['母'])).toBe('她')
  })

  it('关系结果标准化会去重并过滤无效项', () => {
    expect(normalizeRelationshipResult(['叔叔', '叔叔', '', 1, null])).toEqual(['叔叔'])
    expect(normalizeRelationshipResult('叔叔')).toEqual([])
  })

  it('调用库进行称呼计算与关系链计算', () => {
    expect(calculateCallResult(['父', '母'], 1, 'toTarget').length).toBeGreaterThan(0)
    expect(calculateRelationChainResult('奶奶')).toContain('爸爸的妈妈')
    expect(calculateRelationChainResult('  ')).toEqual([])
  })
})
