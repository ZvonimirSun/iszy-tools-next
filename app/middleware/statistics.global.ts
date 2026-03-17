export default defineNuxtRouteMiddleware(async (to, _from) => {
  const toolsStore = useToolsStore()
  const currentTool = getCurrentTool(toolsStore, to)
  if (!currentTool || currentTool.noAccess) {
    return
  }
  toolsStore.access(currentTool)
})
