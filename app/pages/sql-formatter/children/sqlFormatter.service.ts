import type { FormatOptions, IndentStyle, SqlLanguage } from 'sql-formatter'
import { format } from 'sql-formatter'

export interface SqlFormatterOptions {
  language: SqlLanguage
  keywordCase: 'preserve' | 'upper' | 'lower'
  tabWidth: number
  useTabs: boolean
  indentStyle: IndentStyle
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
    indentStyle: options.indentStyle,
    linesBetweenQueries: 1,
  } satisfies FormatOptions)
}
