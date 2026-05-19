import type { FeatureCollection } from '@zvonimirsun/map-sdk/2d'
import type { GeoJsonWorkerResponse } from './geoJson.types'

interface ExportShapefileRequest {
  type: 'export-shapefile'
  taskId: string
  geoJson: FeatureCollection
}

type WorkerRequest = ExportShapefileRequest

globalThis.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const payload = event.data

  try {
    const { zip } = await import('@mapbox/shp-write')
    // TODO: Generate the .prj from geoJson.crs when exporting non-4326 data.
    // @mapbox/shp-write accepts a WKT string via the `prj` option, so this needs
    // an EPSG-to-WKT lookup/mapping before custom CRS Shapefile export is complete.
    const result = await zip<'arraybuffer'>(payload.geoJson as never, {
      outputType: 'arraybuffer',
      compression: 'STORE',
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
