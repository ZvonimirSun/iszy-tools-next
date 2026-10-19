import { createPinia, setActivePinia } from 'pinia'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
const emit = vi.fn()
vi.stubGlobal('authEvents', { emit })
// Exercise the installed release rather than relying on a sibling checkout.
const { useUserStore } = await import('../node_modules/@zvonimirsun/iszy-nuxt-auth-layer/app/stores/user')

beforeEach(() => {
  setActivePinia(createPinia())
  emit.mockClear()
})
afterAll(() => {
  vi.unstubAllGlobals()
})

describe('layer profile requests', () => {
  it('returns the completed result, deduplicates and caches a successful check', async () => {
    let resolve!: (value: unknown) => void
    const fetcher = vi.fn(() => new Promise((yes) => {
      resolve = yes
    }))
    vi.stubGlobal('$fetch', fetcher)
    const store = useUserStore()
    const first = store.pullProfile()
    const second = store.pullProfile()
    expect(fetcher).toHaveBeenCalledTimes(1)
    resolve({ success: true, data: { logged: false } })
    expect(await first).toMatchObject({ success: true, data: { logged: false } })
    await second
    await store.pullProfile()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(store.profilePulled).toBe(true)
  })

  it('rejects a failed check and permits retry', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ success: true, data: { logged: false } }))
    const store = useUserStore()
    await expect(store.pullProfile()).rejects.toThrow('offline')
    expect(store.profilePulled).toBe(false)
    await store.pullProfile()
    expect(store.profilePulled).toBe(true)
  })

  it('does not restore a stale profile after logout', async () => {
    let resolve!: (value: unknown) => void
    vi.stubGlobal('$fetch', vi.fn(() => new Promise((yes) => {
      resolve = yes
    })))
    const store = useUserStore()
    const request = store.pullProfile()
    const rejected = expect(request).rejects.toMatchObject({ name: 'AbortError' })
    await store.removeProfile()
    resolve({ success: true, data: { logged: true, profile: { id: 'old' } } })
    await rejected
    expect(store.logged).toBe(false)
  })
})
