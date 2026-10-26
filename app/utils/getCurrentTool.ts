import type { RouteLocationNormalizedLoadedGeneric } from 'vue-router'
import { findRouteTool } from '#shared/utils/toolCatalog'

export function getCurrentTool(route: Pick<RouteLocationNormalizedLoadedGeneric, 'path'>) {
  return findRouteTool(route.path)
}
