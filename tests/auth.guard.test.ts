import { beforeEach, describe, expect, it, vi } from 'vitest'

const ensureAuth = vi.fn()
const user = { logged: false }
const catalog = { memberTools: [] as { name: string, noAccess: boolean }[] }
const config = { features: { authEnabled: true } }
vi.stubGlobal('defineNuxtRouteMiddleware', (handler: unknown) => handler)
vi.stubGlobal('useRuntimeConfig', () => ({ public: config }))
vi.stubGlobal('useToolsStore', () => ({}))
vi.stubGlobal('getCurrentTool', () => undefined)
vi.stubGlobal('useUserStore', () => user)
vi.stubGlobal('useOriginToolsStore', () => catalog)
vi.stubGlobal('useAuthInitStore', () => ({ ensureAuth }))
vi.stubGlobal('navigateTo', (target: unknown) => target)
vi.stubGlobal('createError', (value: unknown) => value)
const { default: guard } = await import('../app/middleware/auth.global')
const route = (path: string) => ({ path, fullPath: path, query: {}, hash: '' }) as never

beforeEach(() => {
  vi.clearAllMocks()
  config.features.authEnabled = true
  user.logged = false
  catalog.memberTools = []
  ensureAuth.mockResolvedValue(undefined)
})

describe('protected tool navigation', () => {
  it('never checks authentication for a public tool', async () => {
    await guard(route('/json-editor'), route('/'))
    expect(ensureAuth).not.toHaveBeenCalled()
  })

  it('checks protected routes even when they are absent from the visible catalog', async () => {
    expect(await guard(route('/mock'), route('/'))).toEqual({ path: '/login', query: { redirect: '/mock' } })
    expect(ensureAuth).toHaveBeenCalledTimes(1)
  })

  it('waits before allowing navigation and accepts only an explicit permission', async () => {
    let resolve!: () => void
    ensureAuth.mockReturnValueOnce(new Promise<void>((yes) => {
      resolve = yes
    }))
    const pending = guard(route('/mock'), route('/'))
    user.logged = true
    catalog.memberTools = [{ name: 'mock', noAccess: false }]
    resolve()
    expect(await pending).toBeUndefined()
    catalog.memberTools = []
    await expect(guard(route('/mock'), route('/'))).rejects.toMatchObject({ statusCode: 403 })
  })

  it('fails closed on transport failures instead of redirecting to login', async () => {
    ensureAuth.mockRejectedValueOnce(new Error('offline'))
    await expect(guard(route('/mock'), route('/'))).rejects.toMatchObject({ statusCode: 503 })
  })

  it('disables member routes independently of catalog visibility', async () => {
    config.features.authEnabled = false
    expect(await guard(route('/mock'), route('/'))).toBe('/')
    expect(ensureAuth).not.toHaveBeenCalled()
  })
})
