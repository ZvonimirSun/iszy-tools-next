import type { ImgHostingConfig } from '~/pages/imgHosting/children/imgHosting.d'
import { getUploader } from '~/pages/imgHosting/children/imgHosting.service'

const userImgHosting = useSettingsStore().modules.imgHosting

export const useImgHostingStore = defineStore('imgHosting', {
  getters: {
    configs() {
      return userImgHosting.configs
    },
    activeConfigId() {
      return userImgHosting.activeConfigId
    },
    commonConfig() {
      return userImgHosting.commonConfig
    },
    activeConfig(): ImgHostingConfig | null {
      const activeConfigId = userImgHosting.activeConfigId
      if (!activeConfigId)
        return null
      return userImgHosting.configs.find(c => c.id === activeConfigId) || null
    },
    hasConfigs() {
      return userImgHosting.configs.length > 0
    },
    configOptions() {
      return userImgHosting.configs.map(c => ({
        label: `${c.name} (${getUploader(c.type)?.name ?? c.type})`,
        value: c.id,
      }))
    },
  },
  actions: {
    addConfig(config: ImgHostingConfig) {
      userImgHosting.configs.push(config)
      if (!userImgHosting.activeConfigId) {
        userImgHosting.activeConfigId = config.id
      }
    },
    updateConfig(id: string, updates: Partial<ImgHostingConfig>) {
      const index = userImgHosting.configs.findIndex(c => c.id === id)
      if (index !== -1) {
        const imgHostingConfig = { ...userImgHosting.configs[index], ...updates } as ImgHostingConfig
        userImgHosting.configs.splice(index, 1, imgHostingConfig)
      }
    },
    removeConfig(id: string) {
      userImgHosting.configs = userImgHosting.configs.filter(c => c.id !== id)
      if (userImgHosting.activeConfigId === id) {
        userImgHosting.activeConfigId = userImgHosting.configs[0]?.id || null
      }
    },
    setActiveConfig(id: string) {
      userImgHosting.activeConfigId = id
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useImgHostingStore, import.meta.hot))
}
