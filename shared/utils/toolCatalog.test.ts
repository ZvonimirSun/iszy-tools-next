import { describe, expect, it } from 'vitest'
import { tools } from '../data/tools'
import { createPageRouteRules } from './pageCache'
import { filterMemberTools, findRouteTool, getMemberTools, getPublicToolMenus } from './toolCatalog'

describe('public and member catalogs', () => {
  it('partitions the complete catalog without mutating it or retaining empty categories', () => {
    const publicMenus = getPublicToolMenus()
    const publicTools = publicMenus.flatMap(menu => menu.children)
    expect(publicMenus.every(menu => menu.children.length)).toBe(true)
    expect(publicTools.every(tool => !tool.requiresAuth)).toBe(true)
    expect(publicTools.length + getMemberTools().length).toBe(tools.flatMap(menu => menu.children).length)
    expect(getMemberTools().length).toBe(4)
  })

  it('hides anonymous member tools unless showAllTools is enabled', () => {
    expect(filterMemberTools({ authEnabled: true, showAllTools: false })).toEqual([])
    const visible = filterMemberTools({ authEnabled: true, showAllTools: true })
    expect(visible).toHaveLength(4)
    expect(visible.every(tool => tool.noAccess)).toBe(true)
  })

  it('keeps authentication disabled regardless of permissions and visibility configuration', () => {
    expect(filterMemberTools({ authEnabled: false, showAllTools: true, superadmin: true })).toEqual([])
  })

  it('applies individual, global and superadmin permissions', () => {
    const base = { authEnabled: true, showAllTools: false }
    expect(filterMemberTools({ ...base, privileges: ['tool:mock:access'] }).map(tool => tool.name)).toEqual(['mock'])
    for (const extra of [{ privileges: ['tool:all:access'] }, { superadmin: true }]) {
      expect(filterMemberTools({ ...base, ...extra })).toHaveLength(4)
      expect(filterMemberTools({ ...base, ...extra }).every(tool => !tool.noAccess)).toBe(true)
    }
    expect(findRouteTool('/mock')?.requiresAuth).toBe(true)
    expect(findRouteTool('/not-a-tool')).toBeUndefined()
  })
})

describe('page caching boundaries', () => {
  it('caches only public page paths and never external URLs', () => {
    const rules = createPageRouteRules()
    expect(rules['/']).toEqual({ swr: 86400 })
    expect(rules['/json-editor']).toEqual({ swr: 86400 })
    expect(Object.keys(rules).some(key => key.includes('://'))).toBe(false)
    expect(rules['/**']).toBeUndefined()
    expect(rules['/not-a-tool']).toBeUndefined()
  })

  it('keeps authenticated pages client rendered and private routes uncached', () => {
    const rules = createPageRouteRules()
    for (const path of ['/mock', '/urls', '/ai-chat']) {
      expect(rules[path]).toMatchObject({ ssr: false, cache: false })
    }
    for (const path of ['/api/**', '/settings', '/login', '/logout', '/register', '/sso/**']) {
      expect(rules[path]).toMatchObject({ cache: false, headers: { 'cache-control': 'private, no-store' } })
    }
  })

  it('can disable public caching without weakening private route isolation', () => {
    const rules = createPageRouteRules(false)
    expect(rules['/']).toEqual({ cache: false })
    expect(rules['/json-editor']).toEqual({ cache: false })
    expect(rules['/mock']).toMatchObject({ ssr: false, cache: false })
    expect(rules['/api/**']).toMatchObject({ cache: false })
  })
})
