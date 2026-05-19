import type { GeoJsonWorkerResponse, ImportedGeoJson } from './geoJson.types'
import { mergeGeoJsonList, normalizeImportedGeoJson } from './geoJson.file'

interface ImportShapefileRequest {
  type: 'import-shapefile'
  taskId: string
  file: File
}

type WorkerRequest = ImportShapefileRequest

const SHAPEFILE_DBF_ENCODING = 'gbk'
const shapefileEntryPattern = /.+\.(?:shp|dbf|prj)$/i

globalThis.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const payload = event.data

  try {
    const result = await parseShapefileZip(await payload.file.arrayBuffer())
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

async function parseShapefileZip(buffer: ArrayBuffer) {
  const [{ iter }, shpjs] = await Promise.all([
    import('but-unzip'),
    import('shpjs'),
  ])
  const entries = await readShapefileEntries(iter(new Uint8Array(buffer)))
  const names = Object.keys(entries)
    .filter(name => name.toLowerCase().endsWith('.shp'))
    .map(name => name.slice(0, -4))

  if (!names.length) {
    throw new Error('压缩包中未找到 .shp 文件')
  }

  const layers = names.map((name) => {
    const shp = entries[`${name}.shp`]
    if (!shp) {
      throw new Error(`缺少 ${name}.shp`)
    }

    const geometries = shpjs.parseShp(toArrayBuffer(shp))
    const dbf = entries[`${name}.dbf`]
    const properties = dbf
      ? shpjs.parseDbf(toArrayBuffer(dbf), encodeText(SHAPEFILE_DBF_ENCODING))
      : []
    const prjData = entries[`${name}.prj`]
    const prj = prjData ? decodeText(prjData).trim() : ''
    const epsg = getPrjEpsgCode(prj)

    return {
      ...(epsg
        ? {
            crs: {
              type: 'name',
              properties: {
                name: `EPSG:${epsg}`,
              },
            },
          }
        : {}),
      type: 'FeatureCollection',
      features: geometries
        .filter(Boolean)
        .map((geometry, index) => ({
          type: 'Feature',
          geometry,
          properties: properties[index] ?? {},
        })),
    }
  })

  return layers.length === 1 ? layers[0] : layers
}

async function readShapefileEntries(entries: Iterable<{ filename: string, read: () => Promise<Uint8Array> }>) {
  const result: Record<string, Uint8Array> = {}
  await Promise.all(Array.from(entries).map(async (entry) => {
    if (!shapefileEntryPattern.test(entry.filename) || entry.filename.includes('__MACOSX')) {
      return
    }

    result[normalizeEntryName(entry.filename)] = await entry.read()
  }))

  return result
}

function normalizeEntryName(name: string) {
  return name.replace(/\\/g, '/').replace(/\.(shp|dbf|prj)$/i, match => match.toLowerCase())
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
}

function decodeText(data: Uint8Array) {
  return new TextDecoder().decode(data)
}

function encodeText(value: string): ArrayBuffer {
  const data = new TextEncoder().encode(value)
  return toArrayBuffer(data)
}

function getPrjEpsgCode(prj: string) {
  return prj.match(/AUTHORITY\s*\[\s*"EPSG"\s*,\s*"(\d+)"\s*\]/i)?.[1]
    ?? prj.match(/ID\s*\[\s*"EPSG"\s*,\s*(\d+)\s*\]/i)?.[1]
}
