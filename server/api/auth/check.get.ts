import type { ResultDto } from '@zvonimirsun/iszy-common'

export default defineEventHandler(async (event): Promise<ResultDto<{
  logged: boolean
  profile?: PublicSimpleUser
}>> => {
  const session = await getRedisSession(event)
  if (!session) {
    return {
      success: true,
      data: {
        logged: false,
      },
      message: '未登录',
    }
  }
  else {
    try {
      const res = await authFetch<ResultDto<PublicSimpleUser>>(event, '/user/me')
      if (res.success) {
        return {
          success: true,
          data: {
            logged: true,
            profile: toPublicSimpleUser(res.data!),
          },
          message: '已登录',
        }
      }
      else {
        return {
          success: true,
          data: {
            logged: false,
          },
          message: '未登录',
        }
      }
    }
    catch (e) {
      return {
        success: true,
        data: {
          logged: false,
        },
        message: '未登录',
      }
    }
  }
})
