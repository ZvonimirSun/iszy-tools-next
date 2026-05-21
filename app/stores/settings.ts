import type { ResultDto } from '@zvonimirsun/iszy-common'
import type { AiChatSettings } from '#shared/types/aiChat'
import type { ImgHostingConfig } from '~/pages/imgHosting/children/imgHosting'
import { debounce, merge } from 'lodash-es'
import { createDefaultAiChatSettings } from '#shared/data/aiChat'

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
    jsonEditor: {
      syncCloud: false,
    },
    aiChat: {
      ...createDefaultAiChatSettings(),
    } satisfies AiChatSettings,
  })
  const finishSync = ref(false)

  const syncData = debounce(() => {
    if (!useUserStore().logged) {
      return
    }

    if (navigator.onLine) {
      enqueueSyncTask(() => $fetch('/api/tools/settings/tools-next', {
        method: 'POST',
        body: modules.value,
      }))
    }
  })

  async function afterSync() {
    if (!useUserStore().logged) {
      return
    }
    if (finishSync.value) {
      return
    }
    return new Promise<void>((resolve) => {
      const { stop } = watch(finishSync, (val) => {
        if (val) {
          stop()
          resolve()
        }
      })
    })
  }

  async function getSyncData() {
    if (!useUserStore().logged) {
      return
    }
    try {
      const data = await $fetch<ResultDto<any>>('/api/tools/settings/tools-next')
      if (data.success) {
        finishSync.value = true
        if (data.data) {
          merge(modules.value, data.data)
        }
        else {
          syncData()
        }
        watch(modules, syncData, {
          deep: true,
        })
      }
    }
    catch (err) {}
  }

  return {
    general,
    modules,
    afterSync,
    getSyncData,
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
