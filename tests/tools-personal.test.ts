import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { tools } from '#shared/data/tools'

vi.stubGlobal('defineStore', defineStore)
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
const { useOriginToolsStore } = await import('../app/stores/origin-tools')
vi.stubGlobal('useOriginToolsStore', useOriginToolsStore)
vi.stubGlobal('useSettingsStore', () => ({ general: { showType: true } }))
const { useToolsStore } = await import('../app/stores/tools')
const member = tools.flatMap(menu => menu.children).find(tool => tool.name === 'mock')!

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('personal tool visibility', () => {
  it('retains member favorites and history during anonymous catalog repair', () => {
    const store = useToolsStore()
    store.favorite = [{ name: member.name, label: member.label }]
    store.statistics = [{ name: member.name, label: member.label, times: 3, lastAccessTime: 123 }]
    store.fixFavorite()
    expect(store.favorite).toHaveLength(1)
    expect(store.statistics).toHaveLength(1)
    expect(store.toolsFilter(store.favorite, '')).toEqual([])
    useOriginToolsStore().memberTools = [{ ...member, noAccess: false }]
    expect(store.toolsFilter(store.favorite, '')).toHaveLength(1)
    expect(store.toolsFilter(store.statistics, '')).toHaveLength(1)
    useOriginToolsStore().clearMemberTools()
    expect(store.toolsFilter(store.favorite, '')).toEqual([])
    expect(store.favorite).toHaveLength(1)
  })

  it('does not merge visible member entries into public categories', () => {
    useOriginToolsStore().memberTools = [{ ...member, noAccess: false }]
    const store = useToolsStore()
    expect(store.toolMenus.flatMap(menu => menu.children).some(tool => tool.requiresAuth)).toBe(false)
    expect(store.toolsFilter([member], 'mock')).toHaveLength(1)
  })

  it('preserves hidden member favorites when visible favorites are reordered', () => {
    const store = useToolsStore()
    const first = { name: 'ulid', label: 'ULID生成器' }
    const last = { name: 'user-agent', label: 'UserAgent解析' }
    const hidden = { name: member.name, label: member.label }
    store.favorite = [first, hidden, last]
    store.sortFavorite([last, first])
    expect(store.favorite).toEqual([last, hidden, first])
  })
})
