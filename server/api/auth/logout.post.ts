import type { ResultDto } from '@zvonimirsun/iszy-common'
import type { FetchError } from 'ofetch'

export default defineEventHandler(async (event): Promise<ResultDto<void>> => {
  const session = await getRedisSession(event)

  if (!session) {
    return {
      success: true,
      message: '已登出',
    }
  }
  try {
    await authFetch(event, `/auth/logout`, {
      method: 'POST',
    })
  }
  catch (error) {
    const errorCode = (error as FetchError)?.response?.status
    if (errorCode && errorCode !== 401) {
      throw error
    }
  }
  await destroyRedisSession(event)
  return {
    success: true,
    message: '已登出',
  }
})
