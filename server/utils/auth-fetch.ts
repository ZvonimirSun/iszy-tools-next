import type { PublicUser, ResultDto } from '@zvonimirsun/iszy-common'
import type { H3Event } from 'h3'
import type { NitroFetchRequest, TypedInternalResponse } from 'nitropack'
import type { FetchError } from 'ofetch'
import { getProxyRequestHeaders } from 'h3'

async function pipeResponse(event: H3Event, res: Response) {
  setResponseStatus(event, res.status)
  for (const [k, v] of res.headers) setHeader(event, k, v)
  if (res.body == null) {
    return send(event, '')
  }
  return sendStream(event, res.body!)
}

async function refresh(event: H3Event) {
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

export async function proxyFetch(event: H3Event) {
  const sessionId = getSessionId(event)
  const xForwardedFor = event.node.req.headers['x-forwarded-for'] ?? event.node.req.socket.remoteAddress

  const { apiOrigin } = useRuntimeConfig()
  const target = apiOrigin + event.path.slice(4)

  const headers = getProxyRequestHeaders(event)
  delete headers.cookie
  delete headers.host
  // 禁用后端压缩
  headers['accept-encoding'] = 'identity'
  // 传递真实IP
  headers['x-forwarded-for'] = xForwardedFor

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
      await refreshWithLock(sessionId, async () => refresh(event))
    }
    catch (error) {
      await destroyRedisSession(event)
      return pipeResponse(event, res)
    }
    // retry一次
    res = await doRequest()
  }
  return pipeResponse(event, res)
}

export async function authFetch<T = unknown>(event: H3Event, ...params: Parameters<typeof $fetch>): Promise<TypedInternalResponse<NitroFetchRequest, T>> {
  const sessionId = getSessionId(event)
  const originalHeaders = getProxyRequestHeaders(event)
  const xForwardedFor = originalHeaders['x-forwarded-for'] ?? event.node.req.socket.remoteAddress

  const { apiOrigin } = useRuntimeConfig()
  const [url, opts = {}] = params
  const headers: any = opts.headers || {}
  // 传递真实IP
  headers['x-forwarded-for'] = xForwardedFor
  headers['user-agent'] = originalHeaders['user-agent'] || 'Mozilla/5.0 (compatible; authFetch/1.0)'
  headers.referer = originalHeaders.referer
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
        await refreshWithLock(sessionId, async () => refresh(event))
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
