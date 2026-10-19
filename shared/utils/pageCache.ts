import { getMemberTools, getPublicToolMenus } from './toolCatalog'

export function createPageRouteRules(enablePublicCache = true) {
  const rules: Record<string, { swr?: number | false, ssr?: boolean, cache?: false, headers?: Record<string, string> }> = {
    '/': enablePublicCache ? { swr: 86400 } : { cache: false },
    '/api/**': { cache: false, headers: { 'cache-control': 'private, no-store' } },
  }
  for (const tool of getPublicToolMenus().flatMap(menu => menu.children)) {
    if (!tool.name.includes('://'))
      rules[`/${tool.name}`] = enablePublicCache ? { swr: 86400 } : { cache: false }
  }
  for (const tool of getMemberTools()) {
    if (!tool.name.includes('://')) {
      rules[`/${tool.name}`] = { ssr: false, cache: false, headers: { 'cache-control': 'private, no-store' } }
      rules[`/${tool.name}/**`] = rules[`/${tool.name}`]!
    }
  }
  for (const route of ['/login', '/logout', '/register', '/sso/**', '/settings']) {
    rules[route] = { cache: false, headers: { 'cache-control': 'private, no-store' } }
  }
  return rules
}
