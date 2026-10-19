import { kebabCase } from 'scule'
import { findRouteTool } from '#shared/utils/toolCatalog'

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
  const routeTool = findRouteTool(to.path)
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

  if (!routeTool?.requiresAuth) {
    return
  }
  if (import.meta.server)
    return
  if (!authEnabled) {
    return navigateTo('/')
  }
  const userStore = useUserStore()
  try {
    await useAuthInitStore().ensureAuth()
  }
  catch {
    throw createError({ statusCode: 503, statusMessage: '认证服务暂不可用，请刷新重试' })
  }
  // 如果当前工具需要认证但用户未登录，重定向到登录页
  if (!userStore.logged) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
  if (!useOriginToolsStore().memberTools.some(tool => tool.name === routeTool.name && !tool.noAccess)) {
    // 权限不足，重定向到403页
    throw createError({
      statusCode: 403,
      statusMessage: '没有权限访问',
    })
  }
})
