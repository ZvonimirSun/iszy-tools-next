import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, watch } from 'vue'

vi.mock('~/pages/minesweeper/children/minesweeper.service', () => ({ createDefaultMinesweeperSettings: () => ({}) }))
vi.stubGlobal('defineStore', defineStore)
vi.stubGlobal('ref', ref)
vi.stubGlobal('watch', watch)
vi.stubGlobal('useUserStore', () => ({ logged: true }))
vi.stubGlobal('piniaPluginPersistedstate', { cookies: vi.fn(), indexedDBStorage: vi.fn() })
const { useSettingsStore } = await import('../app/stores/settings')

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('settings synchronization cancellation', () => {
  it('releases sync waiters on logout without merging an old account response', async () => {
    let reject!: (reason: Error) => void
    vi.stubGlobal('$fetch', vi.fn((_url, { signal }) => new Promise((_resolve, no) => {
      reject = no
      signal.addEventListener('abort', () => reject(new Error('aborted')))
    })))
    const store = useSettingsStore()
    const request = store.getSyncData()
    const waiter = store.afterSync()
    store.resetSync()
    await Promise.all([request, waiter])
    expect(store.modules.jsonEditor.syncCloud).toBe(false)
  })

  it('discards a stale response even when the transport ignores cancellation', async () => {
    let resolve!: (value: unknown) => void
    vi.stubGlobal('$fetch', vi.fn(() => new Promise(yes => resolve = yes)))
    const store = useSettingsStore()
    const request = store.getSyncData()
    store.resetSync()
    resolve({ success: true, data: { jsonEditor: { syncCloud: true } } })
    await request
    expect(store.modules.jsonEditor.syncCloud).toBe(false)
  })
})
