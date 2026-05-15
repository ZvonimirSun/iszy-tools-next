import type { GeoJsonWorkerResponse, ImportedGeoJson } from './geoJson.types'
import { mergeGeoJsonList, normalizeImportedGeoJson } from './geoJson.file'

interface ImportShapefileRequest {
  type: 'import-shapefile'
  taskId: string
  file: File
}

type WorkerRequest = ImportShapefileRequest

globalThis.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const payload = event.data

  try {
    const { default: shp } = await import('shpjs')
    const result = await shp(await payload.file.arrayBuffer())
    const geoJson = normalizeImportedGeoJson(Array.isArray(result) ? mergeGeoJsonList(result) : result)

    globalThis.postMessage({
      type: 'done',
      taskId: payload.taskId,
      result: geoJson,
    } satisfies GeoJsonWorkerResponse<ImportedGeoJson>)
  }
  catch (error) {
    globalThis.postMessage({
      type: 'error',
      taskId: payload.taskId,
      error: error instanceof Error ? error.message : 'Shapefile 解析失败',
    } satisfies GeoJsonWorkerResponse<ImportedGeoJson>)
  }
})

export default {}
