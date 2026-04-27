import type { ImgHostingConfig } from '~/pages/imgHosting/children/imgHosting.d'
import { getUploader } from '~/pages/imgHosting/children/imgHosting.service'

export const useImgHostingStore = defineStore('imgHosting', {
  state: () => ({
    configs: [] as ImgHostingConfig[],
    activeConfigId: null as string | null,
    commonConfig: {
      renameTimeStamp: true,
      copyUrlAfterUpload: true,
      customCopyContent: '$url',
    },
  }),
  getters: {
    activeConfig: (state): ImgHostingConfig | null => {
      if (!state.activeConfigId)
        return null
      return state.configs.find(c => c.id === state.activeConfigId) || null
    },
    hasConfigs: state => state.configs.length > 0,
    configOptions: state => state.configs.map(c => ({
      label: `${c.name} (${getUploader(c.type)?.name ?? c.type})`,
      value: c.id,
    })),
  },
  actions: {
    addConfig(config: ImgHostingConfig) {
      this.configs.push(config)
      if (!this.activeConfigId) {
        this.activeConfigId = config.id
      }
    },
    updateConfig(id: string, updates: Partial<ImgHostingConfig>) {
      const index = this.configs.findIndex(c => c.id === id)
      if (index !== -1) {
        this.configs[index] = { ...this.configs[index], ...updates } as ImgHostingConfig
      }
    },
    removeConfig(id: string) {
      this.configs = this.configs.filter(c => c.id !== id)
      if (this.activeConfigId === id) {
        this.activeConfigId = this.configs[0]?.id || null
      }
    },
    setActiveConfig(id: string) {
      this.activeConfigId = id
    },
  },
  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useImgHostingStore, import.meta.hot))
}
