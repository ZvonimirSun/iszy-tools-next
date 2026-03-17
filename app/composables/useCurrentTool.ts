export function useCurrentTool() {
  const toolsStore = useToolsStore()
  const route = useRoute()
  return computed(() => {
    return getCurrentTool(toolsStore, route)
  })
}
