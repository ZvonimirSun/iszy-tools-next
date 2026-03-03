import type { ResultDto } from '@zvonimirsun/iszy-common'
import { tools } from '#shared/data/tools'

export default defineEventHandler(async (event): Promise<ResultDto<OriginToolMenu[]>> => {
  const sessionData = await getRedisSession(event)
  const { site: { showAllTools } } = useRuntimeConfig()
  const logged = !!sessionData

  const filteredTools: OriginToolMenu[] = tools.map((tool) => {
    const filteredChildren = tool.children.filter((child) => {
      if ('requiresAuth' in child && child.requiresAuth) {
        // todo 检查角色权限
        child.noAccess = !logged

        if (showAllTools) {
          return true
        }
        else {
          // 如果工具需要认证但用户未登录，或者用户没有访问权限，则不显示该工具
          return !child.noAccess
        }
      }
      else {
        return true
      }
    })
    return {
      ...tool,
      children: filteredChildren,
    }
  }).filter(tool => tool.children.length > 0)

  return {
    success: true,
    data: filteredTools,
    message: '获取成功',
  }
})
