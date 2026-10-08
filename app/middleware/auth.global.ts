import { kebabCase } from 'scule'
import { tools } from '#shared/data/tools'

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { features: { authEnabled } } = useRuntimeConfig().public
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

  if (!authEnabled && (['/login', '/logout', '/register'].includes(to.path) || to.path.startsWith('/sso/'))) {
    return navigateTo('/')
  }

  const toolsStore = useToolsStore()
  const currentTool = getCurrentTool(toolsStore, to)
  const routeTool = tools.flatMap(menu => menu.children).find(tool => tool.name === to.path.slice(1))
  if (!authEnabled && routeTool && 'requiresAuth' in routeTool && routeTool.requiresAuth) {
    return navigateTo('/')
  }
  if (import.meta.client && currentTool?.requiresNetwork && !navigator.onLine) {
    return navigateTo({
      path: '/offline',
      query: {
        redirect: to.fullPath,
      },
    })
  }

  if (!currentTool || !currentTool.noAccess) {
    return
  }
  if (!authEnabled) {
    return navigateTo('/')
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
