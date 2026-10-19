import { beforeEach, describe, expect, it, vi } from 'vitest'

const runtime = { session: { renewalScope: 'all' } }
let path = '/'
const read = vi.fn()
const write = vi.fn()
const header = vi.fn()
vi.stubGlobal('defineResponseMiddleware', (handler: unknown) => handler)
vi.stubGlobal('useRuntimeConfig', () => runtime)
vi.stubGlobal('getRequestURL', () => new URL(`http://localhost${path}`))
vi.stubGlobal('getRedisSession', read)
vi.stubGlobal('setRedisSession', write)
vi.stubGlobal('setResponseHeader', header)
const { default: middleware } = await import('../node_modules/@zvonimirsun/iszy-nuxt-auth-layer/server/middleware/session')

beforeEach(() => {
  vi.clearAllMocks()
  runtime.session.renewalScope = 'api'
  path = '/'
})

describe('session renewal scope', () => {
  it.each(['/', '/json-editor', '/_nuxt/entry.js', '/json-editor/_payload.json', '/apiary'])('does not read or write sessions for %s', async (value) => {
    path = value
    await middleware({} as never, {})
    expect(read).not.toHaveBeenCalled()
    expect(write).not.toHaveBeenCalled()
    expect(header).not.toHaveBeenCalled()
  })

  it.each(['/api', '/api/auth/check', '/api/oauth/github/callback', '/api/tools/member'])('renews sessions and prevents shared caching for %s', async (value) => {
    path = value
    await middleware({} as never, {})
    expect(read).toHaveBeenCalledTimes(1)
    expect(write).toHaveBeenCalledTimes(1)
    expect(header).toHaveBeenCalledWith(expect.anything(), 'Cache-Control', 'private, no-store')
  })

  it('preserves the default all-responses renewal behavior', async () => {
    runtime.session.renewalScope = 'all'
    await middleware({} as never, {})
    expect(read).toHaveBeenCalledTimes(1)
    expect(write).toHaveBeenCalledTimes(1)
  })
})
