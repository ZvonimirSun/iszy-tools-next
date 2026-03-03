import type { ResultDto } from '@zvonimirsun/iszy-common'

export default defineEventHandler(async (event): Promise<ResultDto<void>> => {
  const session = await getRedisSession(event)

  if (!session) {
    return {
      success: true,
      message: '已登出',
    }
  }
  const { apiOrigin } = useRuntimeConfig()
  await $fetch(`${apiOrigin}/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })
  await destroyRedisSession(event)
  return {
    success: true,
    message: '已登出',
  }
})
