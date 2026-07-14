import { format } from 'sql-formatter'
import type { FormatOptions, SqlLanguage } from 'sql-formatter'

export interface SqlFormatterOptions {
  language: SqlLanguage
  keywordCase: 'preserve' | 'upper' | 'lower'
  tabWidth: number
  useTabs: boolean
}

export function formatSql(sql: string, options: SqlFormatterOptions) {
  const value = sql.trim()
  if (!value) {
    return ''
  }

  return format(value, {
    language: options.language,
    keywordCase: options.keywordCase,
    tabWidth: options.tabWidth,
    useTabs: options.useTabs,
    linesBetweenQueries: 1,
  } satisfies FormatOptions)
}
