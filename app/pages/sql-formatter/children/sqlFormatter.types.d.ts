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
      | 'snowflake'
      | 'spark'
      | 'trino'
      | 'tsql'

  export interface FormatOptions {
    language?: SqlLanguage
    keywordCase?: 'preserve' | 'upper' | 'lower'
    tabWidth?: number
    useTabs?: boolean
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
