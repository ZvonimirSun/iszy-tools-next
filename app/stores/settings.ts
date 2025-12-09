export const useSettingsStore = defineStore('settings', {
  state: () => ({
    general: {
      showMost: false,
      showRecent: false,

      showSearch: true,
      showType: true,
      openInNewTab: false,
    },
  }),
})
