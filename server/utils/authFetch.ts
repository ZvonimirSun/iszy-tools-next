import type { PublicUser, ResultDto } from '@zvonimirsun/iszy-common'
import type { H3Event, HTTPHeaderName } from 'h3'
import type { NitroFetchRequest, TypedInternalResponse } from 'nitropack'
import type { FetchError } from 'ofetch'
import { getProxyRequestHeaders } from 'h3'

// 透传请求
export async function proxyFetch(event: H3Event) {
  const sessionId = getSessionId(event)

  const { apiOrigin } = useRuntimeConfig()
  const target = apiOrigin + event.path.slice(4)

  const headers = getProxyRequestHeaders(event, { host: false })
  delete headers.cookie
  // 禁用后端压缩
  headers['accept-encoding'] = 'identity'

  const body
    = ['GET', 'HEAD'].includes(event.method)
      ? undefined
      : await readRawBody(event)

  const doRequest = async () => {
    if (sessionId) {
      const sessionData = await getRedisSession(event)
      if (sessionData) {
        headers.authorization = `Bearer ${sessionData.access_token}`
      }
    }
    return fetch(target, {
      method: event.method,
      headers,
      body,
    })
  }

  let res = await doRequest()
  if (sessionId && res.status === 401) {
    try {
      await _refreshWithLock(sessionId, async () => _refreshToken(event))
    }
    catch (error) {
      await destroyRedisSession(event)
      return _pipeResponse(event, res)
    }
    // retry一次
    res = await doRequest()
  }
  return _pipeResponse(event, res)
}

// 带权限请求
export async function authFetch<T = unknown>(event: H3Event, ...params: Parameters<typeof $fetch>): Promise<TypedInternalResponse<NitroFetchRequest, T>> {
  const sessionId = getSessionId(event)

  const { apiOrigin } = usePublicConfig()
  const [url, opts = {}] = params
  const headers: any = {
    ..._getDeviceInfoHeader(event),
    ...opts.headers,
  }
  opts.headers = headers
  opts.baseURL = apiOrigin

  const doRequest = async (): Promise<TypedInternalResponse<NitroFetchRequest, T>> => {
    if (sessionId) {
      const sessionData = await getRedisSession(event)
      if (sessionData) {
        headers.authorization = `Bearer ${sessionData.access_token}`
      }
    }
    return $fetch(url, opts)
  }
  try {
    return await doRequest()
  }
  catch (error) {
    if (sessionId && (error as FetchError)?.response?.status === 401) {
      try {
        await _refreshWithLock(sessionId, async () => _refreshToken(event))
        return doRequest()
      }
      catch (refreshError) {
        await destroyRedisSession(event)
        throw error
      }
    }
    throw error
  }
}

async function _refreshToken(event: H3Event) {
  const sessionData = await getRedisSession(event)
  if (!sessionData) {
    throw new Error('REFRESH_FAILED')
  }
  const { apiOrigin } = useRuntimeConfig()
  const res = await $fetch<ResultDto<{
    access_token: string
    refresh_token: string
    profile: PublicUser
  }>>(`${apiOrigin}/auth/refresh`, {
    method: 'POST',
    headers: {
      ..._getDeviceInfoHeader(event),
      Authorization: `Bearer ${sessionData.refresh_token}`,
    },
  })
  if (!res.success) {
    throw new Error('REFRESH_FAILED')
  }
  await setRedisSession(event, {
    access_token: res.data!.access_token,
    refresh_token: res.data!.refresh_token,
  })
}

const locks = new Map<string, Promise<void>>()
async function _refreshWithLock(sessionId: string, fn: () => Promise<void>) {
  if (locks.has(sessionId)) {
    return locks.get(sessionId)!
  }

  const p = (async () => {
    try {
      await fn()
    }
    finally {
      locks.delete(sessionId)
    }
  })()

  locks.set(sessionId, p)
  return p
}

function _getDeviceInfoHeader(event: H3Event) {
  const originalHeader = getRequestHeaders(event)
  const remoteAddr = getRequestIP(event, { xForwardedFor: true })!
  const xForwardedFor = originalHeader['x-forwarded-for'] ? `${originalHeader['x-forwarded-for']},${remoteAddr}` : remoteAddr
  const ua = originalHeader['user-agent']
  // const referer = originalHeader.referer

  const headers: Partial<Record<HTTPHeaderName, string>> = {
    'x-forwarded-for': xForwardedFor,
    'x-real-ip': remoteAddr,
  }
  if (ua) {
    headers['user-agent'] = ua
  }
  // if (referer) {
  //   headers['x-forwarded-for'] = referer
  // }

  return headers
}

async function _pipeResponse(event: H3Event, res: Response) {
  setResponseStatus(event, res.status)
  for (const [k, v] of res.headers) setHeader(event, k, v)
  if (res.body == null) {
    return send(event, '')
  }
  return sendStream(event, res.body!)
}
