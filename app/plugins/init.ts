export default defineNuxtPlugin({
  async setup() {
    const fetcher = useRequestFetch()

    const userStore = useUserStore()
    const originToolsStore = useOriginToolsStore()

    await userStore.pullProfile(false, fetcher)
    await originToolsStore.init(fetcher)

    onNuxtReady(() => {
      useSettingsStore().getSyncData()
    })
  },
})
