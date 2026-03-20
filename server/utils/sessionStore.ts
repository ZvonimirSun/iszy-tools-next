import type { SessionData } from '#server/types/session'
import type { Optional } from '@zvonimirsun/iszy-common'
import type { H3Event } from 'h3'
import type { StringValue } from 'ms'
import ms from 'ms'

export function getSessionId(event: H3Event): string | undefined {
  const { session: sessionConfig } = useRuntimeConfig()
  const cookieName = sessionConfig.cookieName
  return getCookie(event, cookieName)
}

export function getSessionKey(sessionId: string): string {
  return `session:${sessionId}`
}

export function setSessionId(id: string, data: Optional<SessionData, 'id'>): SessionData {
  data.id = id
  return data as SessionData
}

export async function getRedisSession(event: H3Event): Promise<SessionData | null> {
  const storage = useStorage<SessionData>('redis')
  const sessionId = getSessionId(event)
  if (!sessionId) {
    return null
  }
  return await storage.getItem(getSessionKey(sessionId))
}

export async function setRedisSession(event: H3Event, data?: Optional<SessionData, 'id'> | null) {
  const { session: sessionConfig } = useRuntimeConfig()

  const cookieName = sessionConfig.cookieName
  const ttl = ms(sessionConfig.maxAge as StringValue) / 1000
  const storage = useStorage<SessionData>('redis')

  let sessionId = getSessionId(event)
  if (!data) {
    if (sessionId) {
      await storage.removeItem(getSessionKey(sessionId))
      sessionId = undefined
      deleteCookie(event, cookieName)
    }
  }
  else {
    if (!sessionId) {
      sessionId = random()
    }
    const sessionData = setSessionId(sessionId, data)
    await storage.setItem(getSessionKey(sessionId), sessionData, {
      ttl,
    })
    setCookie(event, cookieName, sessionId, {
      maxAge: ttl,
      domain: sessionConfig.domain || undefined,
      sameSite: 'lax',
      httpOnly: true,
      secure: true,
    })
  }
}

export async function destroyRedisSession(event: H3Event): Promise<void> {
  return setRedisSession(event, undefined)
}
