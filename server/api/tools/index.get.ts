import type { PublicUser, RawPrivilege, ResultDto } from '@zvonimirsun/iszy-common'
import { tools } from '#shared/data/tools'

export default defineEventHandler(async (event): Promise<ResultDto<OriginToolMenu[]>> => {
  const { features: { showAllTools } } = useRuntimeConfig()

  let user: PublicUser | null = null
  try {
    const res = await authFetch<ResultDto<PublicUser>>(event, '/user/me')
    user = res.data!
  }
  catch (e) {}
  const isSuperAdmin = new Set((user?.roles ?? []).map(role => role.name)).has('superadmin')
  const privilegeMap = new Set((user?.privileges || []).map(p => p.type))

  const filteredTools: OriginToolMenu[] = tools.map((tool) => {
    const filteredChildren = tool.children.filter((child) => {
      if ('requiresAuth' in child && child.requiresAuth) {
        // todo 检查角色权限
        child.noAccess = !checkAccess(child, privilegeMap, isSuperAdmin)

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

function checkAccess(tool: ToolItem, privilegeMap: Set<RawPrivilege['type']>, bypass: boolean) {
  if (bypass) {
    return true
  }
  const toolName = tool.name
  return privilegeMap.has(`tool:${toolName}:access`) || privilegeMap.has(`tool:all:access`)
}
