export function useCurrentTool() {
  return computed(() => {
    if (!import.meta.client) {
      return undefined
    }
    const toolsStore = useToolsStore()
    if (!toolsStore.toolMenus.length)
      return undefined
    return toolsStore.toolItemsMap[useRoute().path.slice(1)]
  })
}
