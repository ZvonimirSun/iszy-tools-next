export default defineNuxtPlugin({
  async setup() {
    const fetcher = useRequestFetch()

    const userStore = useUserStore()
    const originToolsStore = useOriginToolsStore()
    const settingsStore = useSettingsStore()

    authEvents.on('profileUpdated', ({ fetcher }) => {
      return originToolsStore.fetchTools(fetcher)
    })

    authEvents.on('loginSuccess', () => {
      return settingsStore.getSyncData()
    })

    await userStore.pullProfile(false, fetcher as typeof $fetch)
    await originToolsStore.init(fetcher)

    onNuxtReady(() => {
      settingsStore.getSyncData()
    })
  },
})
