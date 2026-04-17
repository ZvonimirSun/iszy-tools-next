export default defineNuxtPlugin(() => {
  const router = useRouter()
  const toolsStore = useToolsStore()

  router.afterEach((to) => {
    const currentTool = getCurrentTool(toolsStore, to)
    if (!currentTool || currentTool.noAccess) {
      return
    }
    toolsStore.access(currentTool)
  })
})
