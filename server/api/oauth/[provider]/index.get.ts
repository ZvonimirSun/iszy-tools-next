import { setState } from '#server/utils/stateStore'

export default defineEventHandler(async (event) => {
  const { apiOrigin } = usePublicConfig()
  const { provider } = event.context.params as { provider: string }
  const url = getRequestURL(event)
  const state = random()
  await setState(state, {})
  // 302 跳转到第三方授权页面
  return sendRedirect(event, `${apiOrigin}/oauth/${provider}?state=${state}&client=${encodeURIComponent(url.origin)}`)
})
