import type { UseWebWorkerReturn } from '@vueuse/core'
import type { WatchHandle } from 'vue'
import type { Encoding } from '~/utils/hashText'

let worker: UseWebWorkerReturn<{
  [K in AlgoNames]: string
}> | null = null
let promise: Promise<void> | null = null
let watcher: WatchHandle | null = null
const data = ref<{
  [K in AlgoNames]: string
} | undefined>()

async function _initWorker() {
  if (!worker) {
    const { default: HashWorker } = await import('~/workers/hashText.worker?worker')
    worker = useWebWorker<{
      [K in AlgoNames]: string
    }>(new HashWorker())
    watcher = watch(worker!.data, (newData) => {
      data.value = toRaw(newData)
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
}

async function post(message: {
  value: string
  encoding?: Encoding
}) {
  if (!worker) {
    if (!promise) {
      promise = _initWorker()
      promise.then(() => {
        promise = null
      })
    }
    await promise
  }
  worker?.post(message)
}

async function terminate() {
  if (promise) {
    await promise
  }
  _removeWorker()
}

export function useHashText() {
  return {
    post,
    terminate,
    data,
  }
}
