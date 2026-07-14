import { describe, expect, it } from 'vitest'
import { formatSql } from './sqlFormatter.service'

describe('sqlFormatter.service', () => {
  it('格式化 SQL 并转换关键字大小写', () => {
    const result = formatSql('select * from users where id = 1', {
      language: 'postgresql',
      keywordCase: 'upper',
      tabWidth: 2,
      useTabs: false,
    })

    expect(result).toContain('SELECT')
    expect(result).toContain('FROM')
    expect(result).toContain('WHERE')
  })

  it('空输入返回空字符串', () => {
    expect(formatSql('   ', {
      language: 'sql',
      keywordCase: 'preserve',
      tabWidth: 2,
      useTabs: false,
    })).toBe('')
  })
})
