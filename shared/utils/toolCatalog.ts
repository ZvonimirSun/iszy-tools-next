import type { ToolItem, ToolMenu } from '../types/tool'
import { tools } from '../data/tools'

export function getPublicToolMenus(catalog: ToolMenu[] = tools): ToolMenu[] {
  return catalog.map(menu => ({
    ...menu,
    children: menu.children.filter(tool => !tool.requiresAuth),
  })).filter(menu => menu.children.length)
}

export function getMemberTools(catalog: ToolMenu[] = tools): ToolItem[] {
  return catalog.flatMap(menu => menu.children).filter(tool => tool.requiresAuth)
}

export function filterMemberTools({ authEnabled, showAllTools, privileges = [], superadmin = false }: {
  authEnabled: boolean
  showAllTools: boolean
  privileges?: string[]
  superadmin?: boolean
}, catalog: ToolMenu[] = tools): ToolItem[] {
  if (!authEnabled)
    return []
  const permissions = new Set(privileges)
  return getMemberTools(catalog).map(tool => ({
    ...tool,
    noAccess: !(superadmin || permissions.has('tool:all:access') || permissions.has(`tool:${tool.name}:access`)),
  })).filter(tool => showAllTools || !tool.noAccess)
}

export function findRouteTool(path: string): ToolItem | undefined {
  return tools.flatMap(menu => menu.children).find(tool => tool.name === path.replace(/\/+$/, '').slice(1))
}
