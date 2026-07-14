declare module 'sql-formatter' {
  export type SqlLanguage
    = | 'sql'
      | 'mysql'
      | 'postgresql'
      | 'sqlite'
      | 'mariadb'
      | 'transactsql'
      | 'plsql'
      | 'bigquery'
      | 'db2'
      | 'hive'
      | 'n1ql'
      | 'redshift'
      | 'snowflake'
      | 'spark'
      | 'trino'
      | 'tsql'

  export type IndentStyle = 'standard' | 'tabularLeft' | 'tabularRight'

  export interface FormatOptions {
    language?: SqlLanguage
    keywordCase?: 'preserve' | 'upper' | 'lower'
    tabWidth?: number
    useTabs?: boolean
    indentStyle?: IndentStyle
    linesBetweenQueries?: number
    paramTypes?: {
      numbered?: boolean | string[]
      named?: string[]
      quoted?: string[]
      custom?: Array<{ regex: string }>
    }
  }

  export function format(sql: string, options?: FormatOptions): string
  export const supportedDialects: string[]
}
