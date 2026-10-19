import { createPinia, defineStore, setActivePinia } from 'pinia'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

vi.stubGlobal('defineStore', defineStore)
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
const { useOriginToolsStore } = await import('../app/stores/origin-tools')

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  setActivePinia(createPinia())
})
afterAll(() => {
  vi.unstubAllGlobals()
})

describe('member catalog lifecycle', () => {
  it('has a public catalog immediately without fetching or serializing member data', () => {
    const store = useOriginToolsStore()
    expect(store.toolMenus.length).toBeGreaterThan(0)
    expect(store.toolItems.every(tool => !tool.requiresAuth)).toBe(true)
    expect(store.memberTools).toEqual([])
  })

  it('deduplicates requests and does not refetch a ready catalog', async () => {
    const request = deferred<{ success: boolean, data: [] }>()
    const fetcher = vi.fn(() => request.promise)
    vi.stubGlobal('$fetch', fetcher)
    const store = useOriginToolsStore()
    const first = store.fetchMemberTools()
    const second = store.fetchMemberTools()
    expect(fetcher).toHaveBeenCalledTimes(1)
    request.resolve({ success: true, data: [] })
    await Promise.all([first, second])
    await store.fetchMemberTools()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(store.memberStatus).toBe('ready')
  })

  it('discards stale responses after logout and replacement requests', async () => {
    const old = deferred<unknown>()
    const fetcher = vi.fn().mockReturnValueOnce(old.promise).mockResolvedValue({ success: true, data: [] })
    vi.stubGlobal('$fetch', fetcher)
    const store = useOriginToolsStore()
    const first = store.fetchMemberTools()
    store.clearMemberTools()
    await store.fetchMemberTools()
    old.resolve({ success: true, data: [{ name: 'mock', label: 'Mock', noAccess: false }] })
    await first
    expect(store.memberTools).toEqual([])
    expect(store.memberStatus).toBe('ready')
  })

  it('fails closed and can retry after a transport failure', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ success: true, data: [] }))
    const store = useOriginToolsStore()
    await expect(store.fetchMemberTools()).rejects.toThrow('offline')
    expect(store.memberStatus).toBe('error')
    expect(store.memberTools).toEqual([])
    await store.fetchMemberTools()
    expect(store.memberStatus).toBe('ready')
  })
})
