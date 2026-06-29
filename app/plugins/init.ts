export default defineNuxtPlugin({
  async setup() {
    const fetcher = useRequestFetch() as Fetcher

    const userStore = useUserStore()
    const originToolsStore = useOriginToolsStore()
    const settingsStore = useSettingsStore()

    authEvents.on('profileUpdated', ({ fetcher }) => {
      return originToolsStore.fetchTools(fetcher)
    })

    authEvents.on('loginSuccess', () => {
      return settingsStore.getSyncData(userStore)
    })

    await userStore.pullProfile(false, fetcher)
    await originToolsStore.init(fetcher)

    onNuxtReady(() => {
      settingsStore.getSyncData(userStore)
    })
  },
})
