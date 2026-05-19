import type { FeatureCollection } from '@zvonimirsun/map-sdk/2d'
import type { GeoJsonWorkerResponse, ImportedGeoJson } from './geoJson.types'

type WorkerFactory = new () => Worker

function createTaskId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function runWorkerTask<T>(WorkerClass: WorkerFactory, message: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    const worker = new WorkerClass()
    const taskId = createTaskId()

    worker.onmessage = (event: MessageEvent<GeoJsonWorkerResponse<T>>) => {
      if (!event.data || event.data.taskId !== taskId) {
        return
      }

      worker.terminate()

      if (event.data.type === 'done') {
        resolve(event.data.result)
        return
      }

      reject(new Error(event.data.error))
    }

    worker.onerror = (event) => {
      worker.terminate()
      reject(new Error(event.message || 'Worker 执行失败'))
    }

    worker.postMessage({
      ...message,
      taskId,
    })
  })
}

export async function importShapefileInWorker(file: File): Promise<ImportedGeoJson> {
  const { default: ImportWorker } = await import('./geoJsonImport.worker?worker')
  return runWorkerTask<ImportedGeoJson>(ImportWorker, {
    type: 'import-shapefile',
    file,
  })
}

export async function exportShapefileInWorker(geoJson: FeatureCollection): Promise<ArrayBuffer> {
  const { default: ExportWorker } = await import('./geoJsonExport.worker?worker')
  return runWorkerTask<ArrayBuffer>(ExportWorker, {
    type: 'export-shapefile',
    geoJson,
  })
}
