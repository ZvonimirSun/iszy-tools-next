export interface TraceMoeQuota {
  id: string
  priority: number | string
  concurrency: number | string
  quota: number | string
  quotaUsed: number | string
}

export interface TraceMoeTitle {
  native?: string
  romaji?: string
  english?: string
  chinese?: string
}

export interface TraceMoeAnilist {
  id: number
  idMal?: number
  title?: TraceMoeTitle
  type?: string
  format?: string
  episodes?: number
  duration?: number
  seasonYear?: number
  siteUrl?: string
  coverImage?: {
    medium?: string
    large?: string
    extraLarge?: string
  }
}

export interface TraceMoeResult {
  anilist?: TraceMoeAnilist
  filename: string
  episode?: number | string
  similarity: number
  from: number
  to: number
  at?: number
  video: string
  image: string
}

export interface TraceMoeSearchResponse {
  frameCount?: number
  error?: string
  result?: TraceMoeResult[]
}

export interface TraceMoeRateLimit {
  limit: string
  remaining: string
  reset: string
}

export interface TraceMoeSearchResult {
  data: TraceMoeSearchResponse
  rateLimit: TraceMoeRateLimit
}
