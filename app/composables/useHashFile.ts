import type { UseWebWorkerReturn } from '@vueuse/core'
import type { WatchHandle } from 'vue'
import type { AlgoNames } from '~/utils/hashText'

interface StartPayload {
  file: File
  algorithms?: AlgoNames[]
}

interface WorkerResponse {
  type: 'progress' | 'done' | 'canceled' | 'error'
  taskId?: string
  progress?: number
  result?: Partial<Record<AlgoNames, string>>
  error?: string
}

let worker: UseWebWorkerReturn<WorkerResponse> | null = null
let promise: Promise<void> | null = null
let watcher: WatchHandle | null = null

const data = ref<Partial<Record<AlgoNames, string>> | undefined>()
const error = ref<string | undefined>()
const isCalculating = ref(false)
const progress = ref(0)
const isCanceled = ref(false)
const activeTaskId = ref<string | undefined>()

async function _initWorker() {
  if (!worker) {
    const { default: HashWorker } = await import('~/workers/hashFile.worker?worker')
    worker = useWebWorker<WorkerResponse>(new HashWorker())
    watcher = watch(worker!.data, (newData) => {
      const rawData = toRaw(newData)
      if (!rawData || !activeTaskId.value || rawData.taskId !== activeTaskId.value) {
        return
      }

      if (rawData.type === 'progress') {
        progress.value = rawData.progress || 0
        return
      }

      if (rawData.type === 'done') {
        data.value = rawData.result
        isCalculating.value = false
        progress.value = 100
        activeTaskId.value = undefined
        return
      }

      if (rawData.type === 'canceled') {
        data.value = undefined
        isCalculating.value = false
        isCanceled.value = true
        progress.value = 0
        activeTaskId.value = undefined
        return
      }

      if (rawData.type === 'error') {
        error.value = rawData.error
        isCalculating.value = false
        progress.value = 0
        activeTaskId.value = undefined
      }
    }, {
      deep: true,
    })
  }
}

function _removeWorker() {
  watcher?.stop()
  watcher = null

  worker?.terminate()
  worker = null

  data.value = undefined
  error.value = undefined
  isCalculating.value = false
  progress.value = 0
  isCanceled.value = false
  activeTaskId.value = undefined
}

async function post(message: StartPayload) {
  if (isCalculating.value) {
    _removeWorker()
  }

  if (!worker) {
    if (!promise) {
      promise = _initWorker()
      promise.then(() => {
        promise = null
      })
    }
    await promise
  }

  data.value = undefined
  error.value = undefined
  isCanceled.value = false
  progress.value = 0
  const taskId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  activeTaskId.value = taskId
  isCalculating.value = true
  worker?.post({
    ...message,
    type: 'start',
    taskId,
  })
}

async function terminate() {
  if (promise) {
    await promise
  }
  _removeWorker()
}

async function cancel() {
  if (!worker) {
    return
  }

  if (activeTaskId.value) {
    worker.post({
      type: 'cancel',
      taskId: activeTaskId.value,
    })
  }

  _removeWorker()
  isCanceled.value = true
}

export function useHashFile() {
  return {
    post,
    cancel,
    terminate,
    data,
    error,
    isCalculating,
    progress,
    isCanceled,
  }
}
