import type { ImgHostingConfig } from '~/pages/imgHosting/children/imgHosting.d'
import { getUploader } from '~/pages/imgHosting/children/imgHosting.service'

export const useImgHostingStore = defineStore('imgHosting', () => {
  const userImgHosting = useSettingsStore().modules.imgHosting

  const activeConfig = computed<ImgHostingConfig | null>(() => {
    const currentActiveConfigId = userImgHosting.activeConfigId
    if (!currentActiveConfigId)
      return null
    return userImgHosting.configs.find(c => c.id === currentActiveConfigId) || null
  })
  const hasConfigs = computed(() => userImgHosting.configs.length > 0)
  const configOptions = computed(() => {
    return userImgHosting.configs.map(c => ({
      label: `${c.name} (${getUploader(c.type)?.name ?? c.type})`,
      value: c.id,
    }))
  })

  function addConfig(config: ImgHostingConfig) {
    userImgHosting.configs.push(config)
    if (!userImgHosting.activeConfigId) {
      userImgHosting.activeConfigId = config.id
    }
  }

  function updateConfig(id: string, updates: Partial<ImgHostingConfig>) {
    const index = userImgHosting.configs.findIndex(c => c.id === id)
    if (index !== -1) {
      const imgHostingConfig = { ...userImgHosting.configs[index], ...updates } as ImgHostingConfig
      userImgHosting.configs.splice(index, 1, imgHostingConfig)
    }
  }

  function removeConfig(id: string) {
    userImgHosting.configs = userImgHosting.configs.filter(c => c.id !== id)
    if (userImgHosting.activeConfigId === id) {
      userImgHosting.activeConfigId = userImgHosting.configs[0]?.id || null
    }
  }

  function setActiveConfig(id: string) {
    userImgHosting.activeConfigId = id
  }

  return {
    configs: userImgHosting.configs,
    activeConfigId: userImgHosting.activeConfigId,
    commonConfig: userImgHosting.commonConfig,
    activeConfig,
    hasConfigs,
    configOptions,
    addConfig,
    updateConfig,
    removeConfig,
    setActiveConfig,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useImgHostingStore, import.meta.hot))
}
