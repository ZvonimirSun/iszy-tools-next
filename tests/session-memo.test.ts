import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const layer = vi.hoisted(() => ({ getRedisSession: vi.fn(), setRedisSession: vi.fn(), rotateRedisSession: vi.fn() }))
vi.mock('#layers/iszy-nuxt-auth-layer/server/utils/sessionStore', () => layer)
const { getRedisSession, setRedisSession, rotateRedisSession, destroyRedisSession } = await import('../server/utils/sessionMemo')
const event = () => ({}) as H3Event
const session = { id: 'A', access_token: 'access', refresh_token: 'refresh' }

beforeEach(() => {
  vi.resetAllMocks()
  layer.getRedisSession.mockResolvedValue(session)
})

describe('request-local session memo', () => {
  it('deduplicates reads and retains an unchanged renewal without sharing between requests', async () => {
    const a = event()
    await Promise.all([getRedisSession(a), getRedisSession(a)])
    await setRedisSession(a, session)
    expect(await getRedisSession(a)).toEqual(session)
    expect(layer.getRedisSession).toHaveBeenCalledTimes(1)
    await getRedisSession(event())
    expect(layer.getRedisSession).toHaveBeenCalledTimes(2)
  })

  it('invalidates writes and deletion, and publishes rotated credentials', async () => {
    const a = event()
    await getRedisSession(a)
    const next = { ...session, id: 'B', access_token: 'new-access' }
    layer.rotateRedisSession.mockResolvedValue(next)
    await rotateRedisSession(a, next)
    expect(await getRedisSession(a)).toBe(next)
    await destroyRedisSession(a)
    layer.getRedisSession.mockResolvedValue(null)
    expect(await getRedisSession(a)).toBeNull()
    expect(layer.setRedisSession).toHaveBeenLastCalledWith(a, undefined)
  })

  it('does not memoize failures', async () => {
    const a = event()
    layer.getRedisSession.mockRejectedValueOnce(new Error('offline'))
    await expect(getRedisSession(a)).rejects.toThrow('offline')
    expect(await getRedisSession(a)).toBe(session)
  })
})
