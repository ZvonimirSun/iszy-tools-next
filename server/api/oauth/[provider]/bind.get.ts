import type { ResultDto } from '@zvonimirsun/iszy-common'
import { setState } from '#server/utils/stateStore'

export default defineEventHandler(async (event) => {
  const { apiOrigin } = useRuntimeConfig()
  const res = await authFetch<ResultDto<string>>(event, '/oauth/code', {
    method: 'POST',
  })
  const code = res.data!
  const { provider } = event.context.params as { provider: string }
  const url = getRequestURL(event)
  const state = random()
  await setState(state, {
    isBind: true,
  })
  return sendRedirect(event, `${apiOrigin}/oauth/${provider}/bind?state=${state}&client=${encodeURIComponent(url.origin)}&access_token=${code}`)
})
