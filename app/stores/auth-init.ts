export const useAuthInitStore = defineStore('authInit', () => {
  const userStore = useUserStore()
  const originToolsStore = useOriginToolsStore()
  const settingsStore = useSettingsStore()
  const toast = useToast()
  const { public: { features: { authEnabled } } } = useRuntimeConfig()
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  let pending: Promise<void> | null = null
  let revision = 0
  let welcomeHandled = false
  const checkFetcher = $fetch.create({})

  function ensureAuth(force = false): Promise<void> {
    if (import.meta.server || !authEnabled)
      return Promise.resolve()
    if (pending && !force)
      return pending
    if (status.value === 'ready' && !force)
      return Promise.resolve()
    const current = ++revision
    status.value = 'loading'
    const request = (async () => {
      try {
        await userStore.pullProfile(false, checkFetcher)
        if (current !== revision)
          return pending ?? undefined
        if (!welcomeHandled) {
          welcomeHandled = true
          if (userStore.logged)
            toast.add({ title: '登录成功', description: '欢迎回来！', color: 'success' })
        }
        // Start settings sync before publishing login readiness to page watchers.
        if (userStore.logged)
          void settingsStore.getSyncData(userStore)
        await originToolsStore.fetchMemberTools(force)
        if (current === revision)
          status.value = 'ready'
      }
      catch (error) {
        if (current !== revision)
          return pending ?? undefined
        status.value = 'error'
        throw error
      }
      finally {
        if (current === revision)
          pending = null
      }
    })()
    pending = request
    return request
  }

  function profileUpdated({ fetcher }: { fetcher?: Fetcher }) {
    if (fetcher === checkFetcher)
      return
    // Explicit login already displays its own welcome notification.
    welcomeHandled = true
    settingsStore.resetSync()
    originToolsStore.clearMemberTools()
    void ensureAuth(true).catch(() => {})
  }

  return { status, ensureAuth, profileUpdated }
})
