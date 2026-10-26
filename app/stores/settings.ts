import type { ResultDto } from '@zvonimirsun/iszy-common'
import type { AiChatSettings } from '#shared/types/aiChat'
import type { ImgHostingConfig } from '~/pages/img-hosting/children/imgHosting'
import { debounce, merge } from 'lodash-es'
import { createDefaultAiChatSettings } from '#shared/data/aiChat'
import { createDefaultMinesweeperSettings } from '~/pages/minesweeper/children/minesweeper.service'

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
    snake: {
      bestScore: 0,
    },
    minesweeper: createDefaultMinesweeperSettings(),
    imgHosting: {
      configs: [] as ImgHostingConfig[],
      activeConfigId: null as string | null,
      commonConfig: {
        renameTimeStamp: true,
        copyUrlAfterUpload: true,
        loadImagesByDefault: true,
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
  let getSyncDataPromise: Promise<void> | null = null
  let stopModulesSyncWatch: (() => void) | null = null
  let syncRevision = 0
  let syncController: AbortController | null = null
  const localModules = ref<typeof modules.value | null>(null)

  const syncData = debounce(() => {
    if (!useUserStore().logged) {
      return
    }

    if (navigator.onLine) {
      const current = syncRevision
      const body = JSON.parse(JSON.stringify(modules.value))
      enqueueSyncTask(() => {
        if (current !== syncRevision || !useUserStore().logged)
          return Promise.resolve()
        return $fetch('/api/tools/settings/tools-next', {
          method: 'POST',
          body,
          signal: syncController?.signal,
        })
      })
    }
  })

  function resetSync() {
    syncRevision++
    syncController?.abort()
    syncController = null
    getSyncDataPromise = null
    stopModulesSyncWatch?.()
    stopModulesSyncWatch = null
    syncData.cancel()
    finishSync.value = false
    // Account settings overlay local preferences only for that login session.
    if (localModules.value) {
      modules.value = localModules.value
      localModules.value = null
    }
  }

  async function afterSync() {
    if (!useUserStore().logged) {
      return
    }
    if (finishSync.value) {
      return
    }
    // Wait for the request itself so logout cancellation also releases callers.
    await getSyncData()
  }

  function getSyncData(userStore = useUserStore()) {
    if (!userStore.logged) {
      return
    }

    if (getSyncDataPromise) {
      return getSyncDataPromise
    }

    finishSync.value = false
    localModules.value ??= JSON.parse(JSON.stringify(modules.value))
    const current = ++syncRevision
    syncController = new AbortController()
    const signal = syncController.signal
    const request = (async () => {
      try {
        const data = await $fetch<ResultDto<any>>('/api/tools/settings/tools-next', { signal })
        if (current !== syncRevision)
          return
        if (data.success) {
          if (data.data) {
            merge(modules.value, data.data)
          }
          else {
            syncData()
          }
          stopModulesSyncWatch?.()
          stopModulesSyncWatch = watch(modules, syncData, {
            deep: true,
          })
        }
      }
      catch (err) {}
      finally {
        if (current === syncRevision)
          finishSync.value = true
      }
    })()

    getSyncDataPromise = request.finally(() => {
      if (current === syncRevision) {
        getSyncDataPromise = null
        syncController = null
      }
    })
    return getSyncDataPromise
  }

  return {
    general,
    modules,
    localModules,
    afterSync,
    getSyncData,
    resetSync,
  }
}, {
  // Read personal preferences only in the browser, never into shared HTML.
  persist: import.meta.client
    ? [
        {
          storage: piniaPluginPersistedstate.cookies(),
          pick: ['general'],
        },
        {
          storage: piniaPluginPersistedstate.indexedDBStorage(),
          omit: ['general'],
        },
      ]
    : false,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot))
}
