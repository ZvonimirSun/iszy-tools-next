import type { PublicUser, RawPrivilege, ResultDto } from '@zvonimirsun/iszy-common'
import { tools } from '#shared/data/tools'

export default defineCachedEventHandler(async (event): Promise<ResultDto<OriginToolMenu[]>> => {
  const { features: { showAllTools } } = useRuntimeConfig()

  let user: PublicUser | null = null
  if (getSessionId(event)) {
    try {
      const res = await authFetch(event)<ResultDto<PublicUser>>('/user/me')
      user = res.data!
    }
    catch (e) {}
  }
  const isSuperAdmin = new Set((user?.roles ?? []).map(role => role.name)).has('superadmin')
  const privilegeMap = new Set((user?.privileges || []).map(p => p.type))

  const filteredTools: OriginToolMenu[] = tools.map((tool) => {
    const filteredChildren = tool.children.flatMap((child) => {
      if ('requiresAuth' in child && child.requiresAuth) {
        // todo 检查角色权限
        const nextChild = {
          ...child,
          noAccess: !checkAccess(child, privilegeMap, isSuperAdmin),
        }

        if (showAllTools || !nextChild.noAccess) {
          return [nextChild]
        }

        // 如果工具需要认证但用户未登录，或者用户没有访问权限，则不显示该工具
        return []
      }

      return [child]
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
}, {
  name: 'api-tools',
  base: 'redis',
  maxAge: 60 * 5,
  swr: true,
  getKey: () => 'anonymous',
  shouldBypassCache: event => Boolean(getSessionId(event)),
})

function checkAccess(tool: ToolItem, privilegeMap: Set<RawPrivilege['type']>, bypass: boolean) {
  if (bypass) {
    return true
  }
  const toolName = tool.name
  return privilegeMap.has(`tool:${toolName}:access`) || privilegeMap.has(`tool:all:access`)
}
