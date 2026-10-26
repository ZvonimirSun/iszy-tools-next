import { describe, expect, it } from 'vitest'
import { tools } from '../data/tools'
import { createPageRouteRules, PUBLIC_PAGE_CACHE, PUBLIC_PAGE_CACHE_CONTROL, sharedPageCacheKey, sharedPagePaths } from './pageCache'
import { filterMemberTools, findRouteTool, getMemberTools, getPublicToolMenus } from './toolCatalog'

describe('public and member catalogs', () => {
  it('partitions the complete catalog without mutating it or retaining empty categories', () => {
    const publicMenus = getPublicToolMenus()
    const publicTools = publicMenus.flatMap(menu => menu.children)
    expect(publicMenus.every(menu => menu.children.length)).toBe(true)
    expect(publicTools.every(tool => !tool.requiresAuth)).toBe(true)
    expect(publicTools.length + getMemberTools().length).toBe(tools.flatMap(menu => menu.children).length)
    expect(getMemberTools().length).toBe(tools.flatMap(menu => menu.children).filter(tool => tool.requiresAuth).length)
  })

  it('hides anonymous member tools unless showAllTools is enabled', () => {
    expect(filterMemberTools({ authEnabled: true, showAllTools: false })).toEqual([])
    const visible = filterMemberTools({ authEnabled: true, showAllTools: true })
    expect(visible).toHaveLength(getMemberTools().length)
    expect(visible.every(tool => tool.noAccess)).toBe(true)
  })

  it('keeps authentication disabled regardless of permissions and visibility configuration', () => {
    expect(filterMemberTools({ authEnabled: false, showAllTools: true, superadmin: true })).toEqual([])
  })

  it('applies individual, global and superadmin permissions', () => {
    const base = { authEnabled: true, showAllTools: false }
    expect(filterMemberTools({ ...base, privileges: ['tool:mock:access'] }).map(tool => tool.name)).toEqual(['mock'])
    for (const extra of [{ privileges: ['tool:all:access'] }, { superadmin: true }]) {
      expect(filterMemberTools({ ...base, ...extra })).toHaveLength(getMemberTools().length)
      expect(filterMemberTools({ ...base, ...extra }).every(tool => !tool.noAccess)).toBe(true)
    }
    expect(findRouteTool('/mock')?.requiresAuth).toBe(true)
    expect(findRouteTool('/not-a-tool')).toBeUndefined()
  })
})

describe('page caching boundaries', () => {
  it('normalizes query keys only for registered pages, with deployment isolation', () => {
    expect(sharedPageCacheKey('site-a', '/mock?room=A')).toBe(sharedPageCacheKey('site-a', '/mock?room=B'))
    expect(sharedPageCacheKey('site-a', '/mock')).not.toBe(sharedPageCacheKey('site-b', '/mock'))
    for (const path of ['/api/auth/check', '/sso/callback?code=secret', '/settings', '/not-a-tool'])
      expect(sharedPageCacheKey('site-a', path)).toBeUndefined()
  })
  it('caches only public page paths and never external URLs', () => {
    const rules = createPageRouteRules()
    expect(rules['/']).toEqual({})
    expect(rules['/json-editor']).toEqual({})
    expect(PUBLIC_PAGE_CACHE).toMatchObject({ swr: true, maxAge: 86400, staleMaxAge: 60 })
    expect(PUBLIC_PAGE_CACHE_CONTROL).toContain('stale-while-revalidate=60')
    expect(sharedPagePaths.has('/mock')).toBe(true)
    for (const tool of tools.flatMap(menu => menu.children).filter(tool => !tool.name.includes('://'))) {
      expect(sharedPagePaths.has(`/${tool.name}`)).toBe(true)
      expect(rules[`/${tool.name}`]).toEqual({})
    }
    expect(Object.keys(rules).some(key => key.includes('://'))).toBe(false)
    expect(rules['/**']).toBeUndefined()
    expect(rules['/not-a-tool']).toBeUndefined()
  })

  it('uses the same shell policy for member pages and keeps private routes uncached', () => {
    const rules = createPageRouteRules()
    for (const path of ['/mock', '/urls', '/ai-chat']) {
      expect(rules[path]).toEqual({})
    }
    for (const path of ['/api/**', '/settings', '/login', '/logout', '/register', '/sso/**']) {
      expect(rules[path]).toMatchObject({ cache: false, headers: { 'cache-control': 'private, no-store' } })
    }
  })

  it('can disable public caching without weakening private route isolation', () => {
    const rules = createPageRouteRules(false)
    expect(rules['/']).toEqual({ cache: false, headers: { 'cache-control': 'private, no-store' } })
    expect(rules['/json-editor']).toEqual({ cache: false, headers: { 'cache-control': 'private, no-store' } })
    expect(rules['/mock']).toMatchObject({ cache: false, headers: { 'cache-control': 'private, no-store' } })
    expect(rules['/api/**']).toMatchObject({ cache: false })
  })
})
