import type { ImgHostingConfig } from '~/pages/imgHosting/children/imgHosting'

export const useSettingsStore = defineStore('settings', () => {
  const general = ref({
    showMost: true,
    showRecent: false,

    showSearch: true,
    showType: true,
    openInNewTab: false,

    theme: {
      mode: 'system' as 'dark' | 'light' | 'system',
    },
  })
  const modules = ref({
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
  })

  return {
    general,
    modules,
  }
}, {
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
