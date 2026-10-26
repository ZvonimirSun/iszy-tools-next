import { getAllTools } from './toolCatalog'

export const PUBLIC_PAGE_CACHE = {
  swr: true,
  maxAge: 86400,
  staleMaxAge: 60,
} as const

export const PUBLIC_PAGE_CACHE_CONTROL = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=60'

export const sharedPagePaths = new Set(['/', ...getAllTools()
  .filter(tool => !tool.name.includes('://'))
  .map(tool => `/${tool.name}`)])

export function sharedPageCacheKey(site: string, requestPath: string) {
  const path = requestPath.split('?')[0]!
  return sharedPagePaths.has(path) ? `${site}:${path}` : undefined
}

export const PRIVATE_ROUTE = {
  cache: false,
  headers: { 'cache-control': 'private, no-store' },
} as const

export function createPageRouteRules(enablePublicCache = true) {
  const rules: Record<string, Record<string, unknown>> = {
    '/': enablePublicCache ? {} : { ...PRIVATE_ROUTE },
    '/api/**': { ...PRIVATE_ROUTE },
  }
  for (const tool of getAllTools()) {
    if (!tool.name.includes('://'))
      rules[`/${tool.name}`] = enablePublicCache ? {} : { ...PRIVATE_ROUTE }
  }
  for (const route of ['/login', '/logout', '/register', '/sso/**', '/settings']) {
    rules[route] = { ...PRIVATE_ROUTE }
  }
  return rules
}
