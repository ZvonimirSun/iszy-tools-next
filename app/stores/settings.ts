export const useSettingsStore = defineStore('settings', {
  state: () => ({
    general: {
      showMost: false,
      showRecent: false,

      showSearch: true,
      showType: true,
      openInNewTab: false,

      theme: {
        mode: 'system' as 'dark' | 'light' | 'system',
      },
    },
  }),
  persist: {
    storage: piniaPluginPersistedstate.cookies(),
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot))
}
