export const useSettingsStore = defineStore('settings', {
  state: () => ({
    general: {
      showMost: false,
      showRecent: false,

      showSearch: true,
      showType: false,
      openInNewTab: false,
    },
  }),
})
