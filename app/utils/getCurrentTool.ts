import type { ToolMenu } from '#shared/types/tool'
import type { RouteLocationNormalizedLoadedGeneric } from 'vue-router'

export function getCurrentTool(toolsStore: { toolMenus: ToolMenu[], toolItemsMap: Record<string, ToolItem> }, route: RouteLocationNormalizedLoadedGeneric) {
  if (!toolsStore.toolMenus.length) {
    return undefined
  }
  return toolsStore.toolItemsMap[route.path.slice(1)]
}
