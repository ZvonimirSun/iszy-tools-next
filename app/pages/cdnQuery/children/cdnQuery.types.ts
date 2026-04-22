export interface AlgoliaOwner {
  name: string
  avatar?: string
  link?: string
}

export interface AlgoliaHit {
  name: string
  version?: string
  description?: string
  owner?: AlgoliaOwner
  homepage?: string
  license?: string
  keywords?: string[]
  objectID: string
}

export interface AlgoliaSearchResponse {
  hits: AlgoliaHit[]
  page: number
  nbHits: number
}

export interface AlgoliaPackageDetail {
  objectID: string
  name?: string
  homepage?: string
  description?: string
  repository?: {
    type?: string
    url?: string
  }
  license?: string
  owner?: {
    name?: string
    link?: string
  }
  version?: string
}

export interface JsdelivrFile {
  type: 'file'
  name: string
  size?: number
}

export interface JsdelivrDirectory {
  type: 'directory'
  name: string
  files: Array<JsdelivrDirectory | JsdelivrFile>
}

export interface FlatFileItem {
  type: 'file' | 'directory'
  name: string
  path: string
  depth: number
  size?: number
}
