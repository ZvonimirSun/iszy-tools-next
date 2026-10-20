import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, reactive, ref } from 'vue'

vi.stubGlobal('defineStore', defineStore)
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { features: { authEnabled: true } } }))
const { useOriginToolsStore } = await import('../app/stores/origin-tools')
vi.stubGlobal('useOriginToolsStore', useOriginToolsStore)
const { useAuthInitStore } = await import('../app/stores/auth-init')
const user = reactive({ logged: false, pullProfile: vi.fn() })
const settings = { getSyncData: vi.fn(), resetSync: vi.fn() }
const toast = { add: vi.fn() }
vi.stubGlobal('useToast', () => toast)
const fetcher = Object.assign(vi.fn(), { create: vi.fn(() => fetcher) })
vi.stubGlobal('$fetch', fetcher)
vi.stubGlobal('useUserStore', () => user)
vi.stubGlobal('useSettingsStore', () => settings)

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  user.logged = false
  user.pullProfile.mockResolvedValue({ success: true, data: { logged: false } })
  fetcher.mockResolvedValue({ success: true, data: [] })
})

describe('deferred authentication', () => {
  it('does not perform network requests when the store is created', () => {
    const auth = useAuthInitStore()
    expect(auth.status).toBe('idle')
    expect(user.pullProfile).not.toHaveBeenCalled()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('deduplicates initialization and fetches anonymous visibility after the check', async () => {
    const auth = useAuthInitStore()
    await Promise.all([auth.ensureAuth(), auth.ensureAuth()])
    expect(user.pullProfile).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledExactlyOnceWith('/api/tools/member')
    expect(auth.status).toBe('ready')
    expect(settings.getSyncData).not.toHaveBeenCalled()
    expect(toast.add).not.toHaveBeenCalled()
  })

  it('welcomes a restored session only once, including forced checks', async () => {
    user.pullProfile.mockImplementation(async () => {
      user.logged = true
    })
    const auth = useAuthInitStore()
    await Promise.all([auth.ensureAuth(), auth.ensureAuth()])
    await auth.ensureAuth(true)
    expect(toast.add).toHaveBeenCalledExactlyOnceWith({
      title: '登录成功',
      description: '欢迎回来！',
      color: 'success',
    })
  })

  it('keeps a failed check distinct from an anonymous session and supports retry', async () => {
    user.pullProfile.mockRejectedValueOnce(new Error('offline'))
    const auth = useAuthInitStore()
    await expect(auth.ensureAuth()).rejects.toThrow('offline')
    expect(auth.status).toBe('error')
    expect(fetcher).not.toHaveBeenCalled()
    expect(toast.add).not.toHaveBeenCalled()
    await auth.ensureAuth(true)
    expect(auth.status).toBe('ready')
    expect(toast.add).not.toHaveBeenCalled()
  })

  it('clears permissions synchronously on profile changes and starts settings sync for logged users', async () => {
    const auth = useAuthInitStore()
    const catalog = useOriginToolsStore()
    catalog.memberTools = [{ name: 'mock', label: 'Mock', noAccess: false }]
    user.logged = true
    auth.profileUpdated({})
    expect(catalog.memberTools).toEqual([])
    expect(settings.resetSync).toHaveBeenCalledTimes(1)
    await auth.ensureAuth()
    expect(settings.getSyncData).toHaveBeenCalledTimes(1)
    expect(auth.status).toBe('ready')
    expect(toast.add).not.toHaveBeenCalled()
  })
})
