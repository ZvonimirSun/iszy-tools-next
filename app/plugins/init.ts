export default defineNuxtPlugin({
  async setup() {
    const fetcher = useRequestFetch() as Fetcher

    const userStore = useUserStore()
    const originToolsStore = useOriginToolsStore()
    const settingsStore = useSettingsStore()

    const profileUpdatedHandler = ({ fetcher }: { fetcher?: Fetcher }) => {
      return originToolsStore.fetchTools(fetcher)
    }
    const loginSuccessHandler = () => {
      return settingsStore.getSyncData(userStore)
    }

    authEvents.on('profileUpdated', profileUpdatedHandler)
    authEvents.on('loginSuccess', loginSuccessHandler)

    try {
      await userStore.pullProfile(false, fetcher)
      await originToolsStore.init(fetcher)
    }
    finally {
      if (import.meta.server) {
        authEvents.off('profileUpdated', profileUpdatedHandler)
        authEvents.off('loginSuccess', loginSuccessHandler)
      }
    }

    onNuxtReady(() => {
      settingsStore.getSyncData(userStore)
    })
  },
})
