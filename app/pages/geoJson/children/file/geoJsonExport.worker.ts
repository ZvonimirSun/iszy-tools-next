import type { FeatureCollection } from '@zvonimirsun/map-sdk/2d'
import type { GeoJsonWorkerResponse } from './geoJson.types'

interface ExportShapefileRequest {
  type: 'export-shapefile'
  taskId: string
  geoJson: FeatureCollection
  prj?: string
}

type WorkerRequest = ExportShapefileRequest

globalThis.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const payload = event.data

  try {
    const { zip } = await import('@mapbox/shp-write')
    const result = await zip<'arraybuffer'>(payload.geoJson as never, {
      outputType: 'arraybuffer',
      compression: 'STORE',
      prj: payload.prj,
    })

    globalThis.postMessage({
      type: 'done',
      taskId: payload.taskId,
      result,
    } satisfies GeoJsonWorkerResponse<ArrayBuffer>, [result])
  }
  catch (error) {
    globalThis.postMessage({
      type: 'error',
      taskId: payload.taskId,
      error: error instanceof Error ? error.message : 'Shapefile 导出失败',
    } satisfies GeoJsonWorkerResponse<ArrayBuffer>)
  }
})

export default {}
