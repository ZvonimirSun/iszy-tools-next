import type { PublicUser, ResultDto } from '@zvonimirsun/iszy-common'
import { filterMemberTools } from '#shared/utils/toolCatalog'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const { features: { showAllTools }, public: { features: { authEnabled } } } = useRuntimeConfig(event)
  let user: PublicUser | undefined
  if (authEnabled && await getRedisSession(event)) {
    try {
      const result = await authFetch(event)<ResultDto<PublicUser>>('/user/me')
      if (!result.success || !result.data)
        throw createError({ statusCode: 503 })
      user = result.data
    }
    catch (error) {
      const status = (error as { statusCode?: number, response?: { status?: number } }).response?.status
        || (error as { statusCode?: number }).statusCode
      if (status !== 401)
        throw createError({ statusCode: 503, statusMessage: 'Authentication service unavailable' })
    }
  }
  return {
    success: true,
    data: {
      logged: Boolean(user),
      profile: user ? toPublicSimpleUser(user) : undefined,
      memberTools: filterMemberTools({
        authEnabled,
        showAllTools,
        privileges: user?.privileges?.map(privilege => privilege.type),
        superadmin: user?.roles?.some(role => role.name === 'superadmin'),
      }),
    },
    message: user ? '已登录' : '未登录',
  }
})
