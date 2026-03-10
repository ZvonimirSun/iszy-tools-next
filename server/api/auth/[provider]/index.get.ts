import { setState } from '#server/utils/state-data'

export default defineEventHandler(async (event) => {
  const { apiOrigin } = useRuntimeConfig()
  const { provider } = event.context.params as { provider: string }
  const url = getRequestURL(event)
  const state = crypto.randomUUID()
  await setState(state, {})
  // 302 跳转到第三方授权页面
  return sendRedirect(event, `${apiOrigin}/auth/${provider}?state=${state}&client=${encodeURIComponent(url.origin)}`)
})
