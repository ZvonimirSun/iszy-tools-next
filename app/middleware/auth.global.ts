import { kebabCase } from 'scule'

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const normalizedPath = to.path
    .split('/')
    .map(segment => kebabCase(segment))
    .join('/')

  if (normalizedPath !== to.path) {
    return navigateTo({
      path: normalizedPath,
      query: to.query,
      hash: to.hash,
    }, {
      redirectCode: 301,
    })
  }

  const toolsStore = useToolsStore()
  const currentTool = getCurrentTool(toolsStore, to)
  if (!currentTool || !currentTool.noAccess) {
    return
  }
  const userStore = useUserStore()
  // 如果当前工具需要认证但用户未登录，重定向到登录页
  if (!userStore.logged) {
    return navigateTo(`/login?redirect=${to.fullPath}`)
  }
  else {
    // 权限不足，重定向到403页
    throw createError({
      statusCode: 403,
      statusMessage: '没有权限访问',
    })
  }
})
