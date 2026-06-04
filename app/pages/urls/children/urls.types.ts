export interface ShortUrlItem {
  keyword: string
  url: string
  title?: string
  ip?: string
  clicks: number
  createdAt: string
  updatedAt: string
}

export interface ShortUrlListData {
  count: number
  rows: ShortUrlItem[]
}

export interface ShortUrlForm {
  keyword: string
  url: string
}

export type ShortUrlSearchField = 'all' | 'keyword' | 'url' | 'title' | 'ip'
export type ShortUrlOrderField = 'keyword' | 'url' | 'title' | 'createdAt' | 'updatedAt' | 'ip' | 'clicks'
export type ShortUrlOrderDirection = 'asc' | 'desc'
export type ShortUrlClicksOperator = 'more' | 'less' | 'equal'
export type ShortUrlCreatedOperator = 'before' | 'after'

export interface ShortUrlListQuery {
  pageIndex: number
  pageSize: number
  search?: string
  searchField?: ShortUrlSearchField
  orderBy?: ShortUrlOrderField
  orderDirection?: ShortUrlOrderDirection
  clicksOperator?: ShortUrlClicksOperator
  clicks?: number
  createdOperator?: ShortUrlCreatedOperator
  createdAt?: string
}

export interface ShortUrlSearchForm {
  search: string
  searchField: ShortUrlSearchField
  orderBy: ShortUrlOrderField
  orderDirection: ShortUrlOrderDirection
  pageSize: number
  clicksOperator: ShortUrlClicksOperator
  clicks: number | undefined
  createdOperator: ShortUrlCreatedOperator
  createdAt: string
}
