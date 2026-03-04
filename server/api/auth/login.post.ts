import type { MinimalUser, PublicUser, ResultDto } from '@zvonimirsun/iszy-common'
import { toMinimalUser } from '@zvonimirsun/iszy-common'

export default defineEventHandler(async (event): Promise<ResultDto<MinimalUser>> => {
  const { apiOrigin } = useRuntimeConfig()
  const body = await readBody<{
    userName: string
    password: string
  }>(event)

  if (!body.userName || !body.password) {
    throw createError({
      statusCode: 400,
      message: '用户名和密码不能为空',
    })
  }
  try {
    const res = await authFetch<ResultDto<{
      access_token: string
      refresh_token: string
      profile: PublicUser
    }>>(event, `${apiOrigin}/auth/login`, {
      method: 'POST',
      body: {
        username: body.userName.trim(),
        password: body.password,
      },
    })
    if (res.success) {
      await setRedisSession(event, {
        access_token: res.data!.access_token,
        refresh_token: res.data!.refresh_token,
      })
    }
    return {
      ...res,
      data: res.data?.profile ? toMinimalUser(res.data.profile) : undefined,
    }
  }
  catch (e) {
    await destroyRedisSession(event)
    return {
      success: false,
      message: '登录失败',
    }
  }
})
