export default defineNuxtRouteMiddleware(async (_to, _from) => {
  const toolsStore = useOriginToolsStore()
  await toolsStore.init()
})
