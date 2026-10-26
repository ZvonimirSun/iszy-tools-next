import type { H3Event } from 'h3'
import type { RenderHandler } from 'nitropack/types'
import { getRequestURL, getResponseHeaders, getResponseStatus } from 'h3'
import { PUBLIC_PAGE_CACHE, PUBLIC_PAGE_CACHE_CONTROL, sharedPageCacheKey, sharedPagePaths } from '#shared/utils/pageCache'

export default defineNitroPlugin((nitro) => {
  // Cache the render result, before it is sent by Nitro. No request URL is
  // rewritten and no user headers/context become part of the cached value.
  const render = defineCachedFunction(async (event: H3Event, handler: RenderHandler) => {
    const response = await handler(event)
    const status = response?.statusCode || getResponseStatus(event)
    const headers = Object.fromEntries(Object.entries({ ...getResponseHeaders(event), ...response?.headers })
      .map(([key, value]) => [key.toLowerCase(), value]))
    const cacheable = Boolean(response && status === 200 && !headers['set-cookie'] && !headers.location
      && !/private|no-store/i.test(String(headers['cache-control'] || '')))
    return { response, cacheable }
  }, {
    ...PUBLIC_PAGE_CACHE,
    name: 'shared-page-shell',
    getKey: (event) => {
      const { public: { url } } = useRuntimeConfig(event)
      return sharedPageCacheKey(url, getRequestURL(event).pathname)!
    },
    validate: entry => Boolean(entry.value?.cacheable),
  })

  nitro.hooks.hook('render:before', (context) => {
    if (import.meta.dev || context.event.method !== 'GET' || !sharedPagePaths.has(getRequestURL(context.event).pathname)
      || getRouteRules(context.event).headers?.['cache-control'] === 'private, no-store') {
      return
    }
    const original = context.render
    context.render = async (event) => {
      const result = await render(event, original)
      if (!result.cacheable)
        return result.response
      return { ...result.response!, headers: { ...result.response?.headers, 'cache-control': PUBLIC_PAGE_CACHE_CONTROL } }
    }
  })

  nitro.hooks.hook('render:response', (response, { event }) => {
    if (!sharedPagePaths.has(getRequestURL(event).pathname) || (response.statusCode || getResponseStatus(event)) !== 200) {
      response.headers ||= {}
      response.headers['cache-control'] = 'private, no-store'
    }
  })
})
