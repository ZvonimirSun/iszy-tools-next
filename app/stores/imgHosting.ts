import type { ImgHostingConfig } from '~/pages/img-hosting/children/imgHosting.d'
import { getUploader } from '~/pages/img-hosting/children/imgHosting.service'

export const useImgHostingStore = defineStore('imgHosting', () => {
  const userImgHosting = computed(() => useSettingsStore().modules.imgHosting)

  const configs = computed(() => userImgHosting.value.configs)
  const activeConfigId = computed(() => userImgHosting.value.activeConfigId)
  const commonConfig = computed(() => userImgHosting.value.commonConfig)
  const activeConfig = computed<ImgHostingConfig | null>(() => {
    const currentActiveConfigId = activeConfigId.value
    if (!currentActiveConfigId)
      return null
    return userImgHosting.value.configs.find(c => c.id === currentActiveConfigId) || null
  })
  const hasConfigs = computed(() => userImgHosting.value.configs.length > 0)
  const configOptions = computed(() => {
    return userImgHosting.value.configs.map(c => ({
      label: `${c.name} (${getUploader(c.type)?.name ?? c.type})`,
      value: c.id,
    }))
  })

  function addConfig(config: ImgHostingConfig) {
    userImgHosting.value.configs.push(config)
    if (!userImgHosting.value.activeConfigId) {
      userImgHosting.value.activeConfigId = config.id
    }
  }

  function updateConfig(id: string, updates: Partial<ImgHostingConfig>) {
    const index = userImgHosting.value.configs.findIndex(c => c.id === id)
    if (index !== -1) {
      const imgHostingConfig = { ...userImgHosting.value.configs[index], ...updates } as ImgHostingConfig
      userImgHosting.value.configs.splice(index, 1, imgHostingConfig)
    }
  }

  function removeConfig(id: string) {
    userImgHosting.value.configs = userImgHosting.value.configs.filter(c => c.id !== id)
    if (userImgHosting.value.activeConfigId === id) {
      userImgHosting.value.activeConfigId = userImgHosting.value.configs[0]?.id || null
    }
  }

  function setActiveConfig(id: string) {
    userImgHosting.value.activeConfigId = id
  }

  return {
    configs,
    activeConfigId,
    commonConfig,
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
