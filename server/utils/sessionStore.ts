import type { Optional } from '@zvonimirsun/iszy-common'
import type { H3Event } from 'h3'
import type { StringValue } from 'ms'
import type { SessionData, SessionTombstone } from '#server/types/session'
import ms from 'ms'

// 旧 session ID 在轮换后保留的过渡时间（秒），用于处理并发请求竞态
const SESSION_TOMBSTONE_TTL = 30

const eventSessionIdKey = 'redisSessionId'
const sessionIdLength = 32

function getEventSessionId(event: H3Event): string | undefined {
  return (event.context as Record<string, string | undefined>)[eventSessionIdKey]
}

function setEventSessionId(event: H3Event, sessionId?: string) {
  const context = event.context as Record<string, string | undefined>
  if (sessionId) {
    context[eventSessionIdKey] = sessionId
  }
  else {
    delete context[eventSessionIdKey]
  }
}

export function getSessionId(event: H3Event): string | undefined {
  const { session: sessionConfig } = useRuntimeConfig()
  const cookieName = sessionConfig.cookieName
  return getEventSessionId(event) || getCookie(event, cookieName)
}

export function getSessionKey(sessionId: string): string {
  return `session:${sessionId}`
}

export function setSessionId(id: string, data: Optional<SessionData, 'id'>): SessionData {
  data.id = id
  return data as SessionData
}

export async function getRedisSession(event: H3Event): Promise<SessionData | null> {
  const storage = useStorage<SessionData | SessionTombstone>('redis')
  const sessionId = getSessionId(event)
  if (!sessionId) {
    return null
  }

  const data = await storage.getItem(getSessionKey(sessionId))
  if (!data) {
    return null
  }

  // 跟随 tombstone（旧 session 已轮换，转发到新 session ID）
  if ('redirectTo' in data) {
    const newSessionId = data.redirectTo
    const newData = await storage.getItem(getSessionKey(newSessionId))
    if (!newData || 'redirectTo' in newData) {
      return null
    }
    // 用新 session ID 更新 cookie，让客户端之后直接用新 ID
    useRedisSession(event, newData as SessionData)
    return newData as SessionData
  }

  return data as SessionData
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
      setEventSessionId(event)
      deleteCookie(event, cookieName)
    }
  }
  else {
    if (!sessionId) {
      sessionId = random(sessionIdLength)
    }
    const sessionData = setSessionId(sessionId, data)
    await storage.setItem(getSessionKey(sessionId), sessionData, {
      ttl,
    })
    setEventSessionId(event, sessionId)
    setCookie(event, cookieName, sessionId, {
      maxAge: ttl,
      domain: sessionConfig.domain || undefined,
      sameSite: 'lax',
      httpOnly: true,
      secure: true,
      priority: 'high',
    })
  }
}

export async function rotateRedisSession(event: H3Event, data: Optional<SessionData, 'id'>) {
  const { session: sessionConfig } = useRuntimeConfig()

  const cookieName = sessionConfig.cookieName
  const ttl = ms(sessionConfig.maxAge as StringValue) / 1000
  const storage = useStorage<SessionData | SessionTombstone>('redis')

  const oldSessionId = getSessionId(event)
  const sessionId = random(sessionIdLength)
  const sessionData = setSessionId(sessionId, data)

  await storage.setItem(getSessionKey(sessionId), sessionData, { ttl })

  // 旧 session 留短 TTL tombstone 而非立即删除，避免并发请求竞态窗口
  if (oldSessionId) {
    await storage.setItem(
      getSessionKey(oldSessionId),
      { redirectTo: sessionId } satisfies SessionTombstone,
      { ttl: SESSION_TOMBSTONE_TTL },
    )
  }

  setEventSessionId(event, sessionId)
  setCookie(event, cookieName, sessionId, {
    maxAge: ttl,
    domain: sessionConfig.domain || undefined,
    sameSite: 'lax',
    httpOnly: true,
    secure: true,
    priority: 'high',
  })

  return sessionData
}

export function useRedisSession(event: H3Event, session: SessionData) {
  setEventSessionId(event, session.id)
  const { session: sessionConfig } = useRuntimeConfig()
  setCookie(event, sessionConfig.cookieName, session.id, {
    maxAge: ms(sessionConfig.maxAge as StringValue) / 1000,
    domain: sessionConfig.domain || undefined,
    sameSite: 'lax',
    httpOnly: true,
    secure: true,
    priority: 'high',
  })
}

export async function destroyRedisSession(event: H3Event): Promise<void> {
  return setRedisSession(event, undefined)
}
