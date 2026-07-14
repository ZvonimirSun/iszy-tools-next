import { describe, expect, it } from 'vitest'
import { formatSql } from './sqlFormatter.service'

describe('sqlFormatter.service', () => {
  it('格式化 SQL 并转换关键字大小写', () => {
    const result = formatSql('select * from users where id = 1', {
      language: 'postgresql',
      keywordCase: 'upper',
      indentStyle: 'standard',
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
      indentStyle: 'standard',
      tabWidth: 2,
      useTabs: false,
    })).toBe('')
  })

  it('支持表格式缩进风格', () => {
    const result = formatSql('select id,name from users', {
      language: 'sql',
      keywordCase: 'upper',
      indentStyle: 'tabularLeft',
      tabWidth: 2,
      useTabs: false,
    })

    expect(result).toContain('SELECT')
  })
})
