import type { lib } from 'crypto-js'
import type { AlgoNames } from '~/utils/hashText'
import { algo as cryptoAlgo, lib as cryptoLib } from 'crypto-js'

interface StartRequest {
  type: 'start'
  taskId: string
  file?: File
  algorithms?: AlgoNames[]
}

interface CancelRequest {
  type: 'cancel'
  taskId?: string
}

type WorkerRequest = StartRequest | CancelRequest

interface WorkerResponse {
  type: 'progress' | 'done' | 'canceled' | 'error'
  taskId?: string
  progress?: number
  result?: Partial<Record<AlgoNames, string>>
  error?: string
}

interface IncrementalHasher {
  update: (messageUpdate: lib.WordArray) => unknown
  finalize: () => lib.WordArray
}

const incrementalHasherFactory: Record<AlgoNames, () => IncrementalHasher> = {
  MD5: () => cryptoAlgo.MD5.create(),
  SHA1: () => cryptoAlgo.SHA1.create(),
  SHA256: () => cryptoAlgo.SHA256.create(),
  SHA224: () => cryptoAlgo.SHA224.create(),
  SHA512: () => cryptoAlgo.SHA512.create(),
  SHA384: () => cryptoAlgo.SHA384.create(),
  SHA3: () => cryptoAlgo.SHA3.create(),
  RIPEMD160: () => cryptoAlgo.RIPEMD160.create(),
}

const CHUNK_SIZE = 4 * 1024 * 1024
const canceledTasks = new Set<string>()

function arrayBufferToWordArray(buffer: ArrayBuffer): lib.WordArray {
  const bytes = new Uint8Array(buffer)
  const words: number[] = []

  for (let i = 0; i < bytes.length; i += 4) {
    words.push(
      ((bytes[i] || 0) << 24)
      | ((bytes[i + 1] || 0) << 16)
      | ((bytes[i + 2] || 0) << 8)
      | (bytes[i + 3] || 0),
    )
  }

  return cryptoLib.WordArray.create(words, bytes.length)
}

globalThis.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const payload = event.data

  if (payload.type === 'cancel') {
    if (payload.taskId) {
      canceledTasks.add(payload.taskId)
    }
    else {
      // Cancel all pending/active tasks if no taskId is provided.
      canceledTasks.add('*')
    }
    return
  }

  const taskId = payload.taskId

  if (!payload?.file) {
    globalThis.postMessage({
      type: 'done',
      taskId,
      result: {},
    } satisfies WorkerResponse)
    return
  }

  try {
    const algorithms: AlgoNames[] = payload.algorithms?.length ? payload.algorithms : ['MD5']
    const hashers = {} as Record<AlgoNames, IncrementalHasher>
    const result: Partial<Record<AlgoNames, string>> = {}
    const totalSize = payload.file.size

    for (const algo of algorithms) {
      hashers[algo] = incrementalHasherFactory[algo]()
    }

    let offset = 0
    while (offset < totalSize) {
      if (canceledTasks.has('*') || canceledTasks.has(taskId)) {
        canceledTasks.delete('*')
        canceledTasks.delete(taskId)
        globalThis.postMessage({
          type: 'canceled',
          taskId,
        } satisfies WorkerResponse)
        return
      }

      const chunk = payload.file.slice(offset, offset + CHUNK_SIZE)
      const chunkBuffer = await chunk.arrayBuffer()
      const chunkWordArray = arrayBufferToWordArray(chunkBuffer)

      for (const algo of algorithms) {
        hashers[algo].update(chunkWordArray)
      }

      offset += chunkBuffer.byteLength

      globalThis.postMessage({
        type: 'progress',
        taskId,
        progress: totalSize ? Math.round((offset / totalSize) * 100) : 100,
      } satisfies WorkerResponse)
    }

    for (const algo of algorithms) {
      result[algo] = hashers[algo].finalize().toString()
    }

    canceledTasks.delete(taskId)
    globalThis.postMessage({
      type: 'done',
      taskId,
      progress: 100,
      result,
    } satisfies WorkerResponse)
  }
  catch (error) {
    globalThis.postMessage({
      type: 'error',
      taskId,
      error: error instanceof Error ? error.message : '文件 Hash 计算失败',
    } satisfies WorkerResponse)
  }
})

export default {}
