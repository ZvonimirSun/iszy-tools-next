export interface OriginToolItem {
  name: string
  link: string
}

export interface OriginToolMenu {
  type: string
  icon: string
  children: OriginToolItem[]
}
