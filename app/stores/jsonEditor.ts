import type { ResultDto } from '@zvonimirsun/iszy-common'
import dayjs from 'dayjs'
import { clamp, debounce } from 'lodash-es'

export interface JsonEditorData {
  name: string
  updated?: string
  indentation?: number
  content: {
    text?: string
    json?: unknown
  }
}

export type JsonEditorMode = 'text' | 'tree' | 'table'

interface SyncDto {
  key: string
  name: string
  text?: string
  json?: unknown
  updatedAt?: string
}

type SyncPayload = Pick<SyncDto, 'name'> & Partial<Pick<SyncDto, 'text' | 'json'>>

interface SaveDataOptions {
  left?: boolean
  right?: boolean
  id?: string
  content?: unknown
  name?: string
  indentation?: number
}

let waitList = {} as Record<string, SyncPayload>
let listened = false

export const useJsonEditorStore = defineStore('jsonEditor', () => {
  const leftId = ref<string | null>(null)
  const rightId = ref<string | null>(null)
  const splitterValue = ref(0.5)
  const fullStatus = ref('')
  const leftMode = ref<JsonEditorMode>('text')
  const rightMode = ref<JsonEditorMode>('text')
  const $_data = ref<Record<string, JsonEditorData>>({})

  const syncCloud = computed(() => {
    return useUserStore().logged && useSettingsStore().modules.jsonEditor.syncCloud
  })

  function dataList(keyword = '') {
    const result = Object.entries($_data.value).map(([key, item]) => ({
      _id: key,
      name: item.name,
      updated: formatUpdated(item.updated),
    }))

    if (keyword) {
      return result.filter(item => item.name.includes(keyword))
    }

    return result
  }

  function data(id: string) {
    const item = $_data.value[id]
    if (!item) {
      return null
    }

    return formatEditorData(item)
  }

  function setSplitter(val = 0.5) {
    splitterValue.value = clamp(val, 0, 1)
  }

  function setFullStatus(val?: 'left' | 'right' | unknown) {
    fullStatus.value = val === 'left' || val === 'right' ? val : ''
  }

  function replaceState(val: SyncDto[] = []) {
    const nextData: Record<string, JsonEditorData> = {}
    for (const d of val) {
      nextData[d.key] = {
        name: d.name,
        content: {},
      }

      if (d.text != null) {
        nextData[d.key]!.content.text = d.text
      }
      else if (d.json != null) {
        nextData[d.key]!.content.json = markRaw(d.json)
      }

      nextData[d.key]!.updated = dayjs(d.updatedAt).format()
    }

    $_data.value = nextData
  }

  async function getSyncData() {
    try {
      const data = await $fetch<ResultDto<SyncDto[]>>('/api/tools/jsoneditor')
      if (data.success) {
        replaceState(data.data)
      }
      else {
        console.warn(data.message)
      }
    }
    catch (e) {
      console.error((e as Error).message)
    }
  }

  const syncData = debounce(({ id, data }: {
    id: string
    data: SyncPayload
  }) => {
    if (!import.meta.client) {
      return
    }

    if (navigator.onLine) {
      enqueueSyncTask(() => $fetch(`/api/tools/jsoneditor/${id}`, {
        method: 'POST',
        body: data,
      }))
      return
    }

    waitList[id] = data

    if (!listened) {
      listened = true

      function reSync() {
        window.removeEventListener('online', reSync)
        listened = false

        for (const id in waitList) {
          useJsonEditorStore().syncData({ id, data: waitList[id]! })
        }
        waitList = {}
      }

      window.addEventListener('online', reSync)
    }
  }, 500)

  function saveData({ left, right, id, content, name, indentation }: SaveDataOptions = {}) {
    let dataId = id

    if (syncCloud.value) {
      dataId = dataId || randomString(6)
      if (content != null || name != null) {
        const item: SyncPayload = { name: name || $_data.value[dataId]?.name || `文档-${dataId}` }

        if (typeof content === 'string') {
          item.text = content
        }
        else if (typeof content !== 'undefined') {
          item.json = toJsonContent(content)
        }

        syncData({ id: dataId, data: item })
      }
    }

    if (typeof content !== 'undefined') {
      dataId = dataId || randomString(6)
      $_data.value[dataId] = $_data.value[dataId] || {} as JsonEditorData
      $_data.value[dataId]!.name = name || $_data.value[dataId]!.name || `文档-${dataId}`
      $_data.value[dataId]!.indentation = indentation ?? $_data.value[dataId]!.indentation

      if (typeof content === 'string') {
        $_data.value[dataId]!.content = {
          text: content,
        }
      }
      else {
        $_data.value[dataId]!.content = {
          json: toJsonContent(content),
        }
      }

      $_data.value[dataId]!.updated = dayjs().format()
      setActiveSide({ left, right, id: dataId })
      return dataId
    }

    if (dataId && $_data.value[dataId]) {
      $_data.value[dataId]!.name = name || $_data.value[dataId]!.name
      $_data.value[dataId]!.indentation = indentation ?? $_data.value[dataId]!.indentation
      if (indentation != null) {
        $_data.value[dataId]!.updated = dayjs().format()
      }
      setActiveSide({ left, right, id: dataId })
      return dataId
    }

    clearActiveSide({ left, right })
    return null
  }

  async function deleteData({ id }: { id: string }) {
    if (syncCloud.value) {
      try {
        const data = await $fetch<ResultDto<void>>(`/api/tools/jsoneditor/${id}`, {
          method: 'DELETE',
        })
        if (!data.success) {
          console.warn(data.message)
          return
        }
      }
      catch (e) {
        console.error(e)
        return
      }
    }

    if (leftId.value === id) {
      leftId.value = null
    }
    if (rightId.value === id) {
      rightId.value = null
    }
    if ($_data.value[id]) {
      delete $_data.value[id]
    }
  }

  function setActiveSide({ left, right, id }: {
    left?: boolean
    right?: boolean
    id: string
  }) {
    if (left) {
      leftId.value = id
    }
    if (right) {
      rightId.value = id
    }
  }

  function clearActiveSide({ left, right }: Pick<SaveDataOptions, 'left' | 'right'>) {
    if (left) {
      leftId.value = null
    }
    if (right) {
      rightId.value = null
    }
  }

  function formatEditorData(item: JsonEditorData) {
    return {
      ...item,
      updated: formatUpdated(item.updated),
    }
  }

  function formatUpdated(updated?: string) {
    return dayjs(updated).format('YYYY-MM-DD HH:mm')
  }

  function toJsonContent(content: unknown) {
    if (content !== null && typeof content === 'object') {
      return markRaw(content)
    }

    return content
  }

  return {
    leftId,
    rightId,
    splitterValue,
    fullStatus,
    leftMode,
    rightMode,
    $_data,
    dataList,
    data,
    syncCloud,
    setSplitter,
    setFullStatus,
    getSyncData,
    syncData,
    saveData,
    deleteData,
  }
}, {
  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useJsonEditorStore, import.meta.hot))
}
