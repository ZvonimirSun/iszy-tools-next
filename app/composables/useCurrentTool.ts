export function useCurrentTool() {
  const route = useRoute()
  return computed(() => {
    return useToolsStore().toolItemsMap[route.path.slice(1)]
  })
}
