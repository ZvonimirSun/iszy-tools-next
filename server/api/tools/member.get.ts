import type { PublicUser, ResultDto } from '@zvonimirsun/iszy-common'
import { filterMemberTools } from '#shared/utils/toolCatalog'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const { features: { showAllTools }, public: { features: { authEnabled } } } = useRuntimeConfig(event)
  let user: PublicUser | undefined
  if (authEnabled && getSessionId(event)) {
    try {
      const res = await authFetch(event)<ResultDto<PublicUser>>('/user/me')
      if (!res.success || !res.data)
        throw createError({ statusCode: 503, statusMessage: 'Permission service unavailable' })
      user = res.data
    }
    catch (error) {
      const status = (error as { statusCode?: number, response?: { status?: number } }).response?.status
        || (error as { statusCode?: number }).statusCode
      if (status !== 401)
        throw createError({ statusCode: 503, statusMessage: 'Permission service unavailable' })
    }
  }
  return {
    success: true,
    data: filterMemberTools({
      authEnabled,
      showAllTools,
      privileges: user?.privileges?.map(privilege => privilege.type),
      superadmin: user?.roles?.some(role => role.name === 'superadmin'),
    }),
    message: '获取成功',
  }
})
