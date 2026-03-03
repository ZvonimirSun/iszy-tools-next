export default defineNuxtRouteMiddleware(async (_to, _from) => {
  const originToolsStore = useOriginToolsStore()
  await originToolsStore.init()
  const toolsStore = useToolsStore()
  const currentTool = toolsStore.toolItemsMap[_to.path.slice(1)]
  if (currentTool?.noAccess) {
    const userStore = useUserStore()
    // 如果当前工具需要认证但用户未登录，重定向到登录页
    if (!userStore.logged) {
      return navigateTo(`/login?redirect=${_to.fullPath}`)
    }
    else {
      // 权限不足，重定向到403页
      throw createError({
        statusCode: 403,
        statusMessage: '没有权限访问',
      })
    }
  }
})
