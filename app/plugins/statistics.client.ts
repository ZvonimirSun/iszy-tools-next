export default defineNuxtPlugin(() => {
  const router = useRouter()
  const toolsStore = useToolsStore()

  router.afterEach((to) => {
    const currentTool = getCurrentTool(to)
    // Metadata is static, while noAccess is derived from the user's catalog.
    const visibleTool = currentTool && toolsStore.toolItemsMap[currentTool.name]
    if (!currentTool || !visibleTool || visibleTool.noAccess) {
      return
    }
    toolsStore.access(currentTool)
  })
})
