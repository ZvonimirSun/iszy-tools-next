import type { FeatureCollection } from '@zvonimirsun/map-sdk/2d'
import type { GeoJsonWorkerResponse } from './geoJson.types'

type DbfValue = boolean | number | string | null | undefined
type DbfRow = Record<string, DbfValue>
type DbfFieldType = 'C' | 'L' | 'N'

interface DbfField {
  name: string
  sourceName: string
  type: DbfFieldType
  size: number
}

interface ShapefileLayer {
  filename: string
  properties: DbfRow[]
}

interface ExportShapefileRequest {
  type: 'export-shapefile'
  taskId: string
  geoJson: FeatureCollection
  prj?: string
}

type WorkerRequest = ExportShapefileRequest

const SHAPEFILE_DBF_ENCODING = 'UTF-8'
const encoder = new TextEncoder()

globalThis.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const payload = event.data

  try {
    const { zip } = await import('@mapbox/shp-write')
    const shapefileBuffer = await zip<'arraybuffer'>(payload.geoJson as never, {
      outputType: 'arraybuffer',
      compression: 'STORE',
      prj: payload.prj,
    })
    const result = await rewriteDbfFiles(shapefileBuffer, payload.geoJson)

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

async function rewriteDbfFiles(buffer: ArrayBuffer, geoJson: FeatureCollection) {
  const { strToU8, unzipSync, zipSync } = await import('fflate')
  const files = unzipSync(new Uint8Array(buffer))
  const layers = getShapefileLayers(geoJson)

  for (const [name] of Object.entries(files)) {
    if (!name.toLowerCase().endsWith('.dbf')) {
      continue
    }

    const layer = layers.get(getBaseFilename(name))
    if (!layer) {
      continue
    }

    files[name] = writeDbf(layer.properties)
    files[name.replace(/\.dbf$/i, '.cpg')] = strToU8(SHAPEFILE_DBF_ENCODING)
  }

  return toArrayBuffer(zipSync(files, { level: 0 }))
}

function getShapefileLayers(geoJson: FeatureCollection) {
  const layers = new Map<string, ShapefileLayer>()
  const features = Array.isArray(geoJson.features) ? geoJson.features : []

  for (const layer of [
    { geometryType: 'Point', filename: 'POINT' },
    { geometryType: 'LineString', filename: 'POLYLINE' },
    { geometryType: 'Polygon', filename: 'POLYGON' },
    { geometryType: 'MultiPolygon', filename: 'POLYGON' },
    { geometryType: 'MultiLineString', filename: 'POLYLINE' },
  ]) {
    const properties = features
      .filter(feature => feature.geometry?.type === layer.geometryType)
      .map(feature => normalizeProperties(feature.properties))

    if (properties.length) {
      layers.set(layer.filename, {
        filename: layer.filename,
        properties,
      })
    }
  }

  return layers
}

function normalizeProperties(properties: unknown): DbfRow {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return {}
  }

  return properties as DbfRow
}

function writeDbf(rows: DbfRow[]) {
  const fields = getDbfFields(rows)
  const fieldDescriptorLength = (32 * fields.length) + 1
  const headerLength = 32 + fieldDescriptorLength
  const bytesPerRecord = fields.reduce((total, field) => total + field.size, 1)
  const buffer = new ArrayBuffer(headerLength + (bytesPerRecord * rows.length) + 1)
  const view = new DataView(buffer)
  const now = new Date()

  view.setUint8(0, 0x03)
  view.setUint8(1, now.getFullYear() - 1900)
  view.setUint8(2, now.getMonth() + 1)
  view.setUint8(3, now.getDate())
  view.setUint32(4, rows.length, true)
  view.setUint16(8, headerLength, true)
  view.setUint16(10, bytesPerRecord, true)
  view.setUint8(headerLength - 1, 0x0D)

  fields.forEach((field, index) => {
    const offset = 32 + (index * 32)
    writeBytes(view, offset, encoder.encode(field.name), 10, 0)
    view.setUint8(offset + 11, field.type.charCodeAt(0))
    view.setUint8(offset + 16, field.size)
    if (field.type === 'N') {
      view.setUint8(offset + 17, 3)
    }
  })

  let offset = headerLength
  for (const row of rows) {
    view.setUint8(offset, 32)
    offset += 1

    for (const field of fields) {
      offset = writeDbfValue(view, offset, field, row[field.sourceName])
    }
  }

  view.setUint8(offset, 0x1A)

  return new Uint8Array(buffer)
}

function getDbfFields(rows: DbfRow[]): DbfField[] {
  const fields: DbfField[] = []
  const fieldNames = new Set<string>()
  const fieldSamples = new Map<string, DbfValue>()

  for (const row of rows) {
    for (const [sourceName, value] of Object.entries(row)) {
      if (value != null || !fieldSamples.has(sourceName)) {
        fieldSamples.set(sourceName, value)
      }
    }
  }

  for (const [sourceName, value] of fieldSamples) {
    const type = getDbfFieldType(value)
    if (type) {
      const name = getUniqueFieldName(sourceName, fieldNames)
      fieldNames.add(name)
      fields.push({
        name,
        sourceName,
        type,
        size: type === 'C' ? 254 : type === 'N' ? 18 : 1,
      })
    }
  }

  return fields
}

function getDbfFieldType(value: DbfValue): DbfFieldType | undefined {
  if (typeof value === 'boolean') {
    return 'L'
  }

  if (typeof value === 'number') {
    return 'N'
  }

  if (typeof value === 'string' || value == null) {
    return 'C'
  }
}

function getUniqueFieldName(sourceName: string, usedNames: Set<string>) {
  const fallbackName = `field${usedNames.size + 1}`
  const baseName = decodeValidUtf8(truncateBytes(encoder.encode(sourceName || fallbackName), 10)) || fallbackName

  if (!usedNames.has(baseName)) {
    return baseName
  }

  let index = 2
  while (true) {
    const suffix = `_${index}`
    const candidate = `${decodeValidUtf8(truncateBytes(encoder.encode(baseName), 10 - suffix.length))}${suffix}`
    if (!usedNames.has(candidate)) {
      return candidate
    }
    index += 1
  }
}

function writeDbfValue(view: DataView, offset: number, field: DbfField, value: DbfValue) {
  if (field.type === 'L') {
    view.setUint8(offset, value ? 84 : 70)
    return offset + 1
  }

  if (field.type === 'N') {
    const numberValue = typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
    writeBytes(view, offset, encoder.encode(numberValue.padStart(field.size, ' ').slice(0, field.size)), field.size, 32)
    return offset + field.size
  }

  const bytes = truncateBytes(encoder.encode(value == null ? '' : String(value)), field.size)
  writeBytes(view, offset, bytes, field.size, 32)
  return offset + field.size
}

function writeBytes(view: DataView, offset: number, bytes: Uint8Array, size: number, padding: number) {
  for (let index = 0; index < size; index += 1) {
    view.setUint8(offset + index, bytes[index] ?? padding)
  }
}

function truncateBytes(bytes: Uint8Array, maxLength: number) {
  if (bytes.length <= maxLength) {
    return bytes
  }

  let end = maxLength
  while (end > 0 && ((bytes[end] ?? 0) & 0xC0) === 0x80) {
    end -= 1
  }

  return bytes.slice(0, end)
}

function decodeValidUtf8(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes).replace(/\0/g, '').trim()
}

function getBaseFilename(name: string) {
  return name.replace(/\\/g, '/').split('/').pop()?.replace(/\.dbf$/i, '') ?? name
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
}
