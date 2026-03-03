export interface OriginToolItem {
  name: string
  label: string
}

export interface OriginToolMenu {
  label: string
  children: (OriginToolItem | ToolItem)[]
}

interface ToolMeta {
  tags?: string[]
  requiresAuth?: boolean
  online?: boolean

  noAccess?: boolean
}

export interface ToolItem extends OriginToolItem, ToolMeta {
}

export interface ToolMenu extends OriginToolMenu {
  children: ToolItem[]
}

export type ToolRecord = OriginToolItem
export type Favorite = ToolRecord

export interface Statistic extends ToolRecord {
  times: number
  lastAccessTime: number
}
