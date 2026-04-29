import type { ImgHostingConfig } from '~/pages/imgHosting/children/imgHosting'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    general: {
      showMost: true,
      showRecent: false,

      showSearch: true,
      showType: true,
      openInNewTab: false,

      theme: {
        mode: 'system' as 'dark' | 'light' | 'system',
      },
    },
    modules: {
      2048: {
        bestScore: 0,
      },
      tetris: {
        bestScore: 0,
      },
      imgHosting: {
        configs: [] as ImgHostingConfig[],
        activeConfigId: null as string | null,
        commonConfig: {
          renameTimeStamp: true,
          copyUrlAfterUpload: true,
          customCopyContent: '$url',
        },
      },
    },
  }),
  persist: [
    {
      storage: piniaPluginPersistedstate.cookies(),
      pick: ['general'],
    },
    {
      storage: piniaPluginPersistedstate.indexedDBStorage(),
      omit: ['general'],
    },
  ],
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot))
}
