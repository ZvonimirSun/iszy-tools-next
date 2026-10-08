export default defineNuxtPlugin({
  async setup() {
    const fetcher = useRequestFetch() as Fetcher
    const { public: { features: { authEnabled } } } = useRuntimeConfig()

    const userStore = useUserStore()
    const originToolsStore = useOriginToolsStore()
    const settingsStore = useSettingsStore()

    const profileUpdatedHandler = ({ fetcher }: { fetcher?: Fetcher }) => {
      return originToolsStore.fetchTools(fetcher)
    }
    const loginSuccessHandler = () => {
      return settingsStore.getSyncData(userStore)
    }

    await Promise.all([
      authEnabled ? userStore.pullProfile(false, fetcher) : Promise.resolve(),
      originToolsStore.init(fetcher),
    ])

    if (import.meta.client) {
      authEvents.on('profileUpdated', profileUpdatedHandler)
      authEvents.on('loginSuccess', loginSuccessHandler)
    }

    onNuxtReady(() => {
      if (authEnabled) {
        settingsStore.getSyncData(userStore)
      }
    })
  },
})
