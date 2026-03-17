export default defineNuxtPlugin({
  async setup() {
    const headers = useRequestHeaders()

    const userStore = useUserStore()
    const originToolsStore = useOriginToolsStore()

    await userStore.pullProfile(false, headers)
    await originToolsStore.init(headers)
  },
})
