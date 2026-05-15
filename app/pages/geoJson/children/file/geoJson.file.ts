import type { Feature, GeoJSON, Geometry } from '@zvonimirsun/map-sdk'
import type { GeoJsonExportOptions, GeoJsonExportResult, GeoJsonImportFormat } from './geoJson.types'
import { isGeoJsonObject, isGeometry, toFeatureCollection } from '../utils'
import { exportShapefileInWorker, importShapefileInWorker } from './useGeoJsonFileWorkers'

export const geoJsonImportFormatItems = [
  { label: 'GeoJSON', value: 'geojson' },
  { label: 'GeoJSONL', value: 'geojsonl' },
  { label: 'Esri Shapefile', value: 'shapefile' },
] satisfies Array<{ label: string, value: GeoJsonImportFormat }>

export const geoJsonExportFormatItems = [
  { label: 'GeoJSON', value: 'geojson' },
  { label: 'GeoJSONL', value: 'geojsonl' },
  { label: 'Esri Shapefile', value: 'shapefile' },
] satisfies Array<{ label: string, value: GeoJsonExportOptions['format'] }>

export function guessImportFormat(file: File): GeoJsonImportFormat {
  const name = file.name.toLowerCase()

  if (name.endsWith('.zip')) {
    return 'shapefile'
  }

  if (/\.(?:geojsonl|geojsons|ld)$/i.test(name)) {
    return 'geojsonl'
  }

  if (/\.(?:geojson|json)$/i.test(name)) {
    return 'geojson'
  }

  throw new Error('无法识别文件格式')
}

export async function parseGeoJsonFile(file: File): Promise<GeoJSON> {
  const data = JSON.parse(await file.text()) as unknown
  if (!isGeoJsonObject(data)) {
    throw new Error('文件内容不是有效的 GeoJSON')
  }

  return data
}

export async function parseGeoJsonLinesFile(file: File): Promise<GeoJSON> {
  const features = (await file.text())
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .flatMap((line, index) => {
      let data: unknown
      try {
        data = JSON.parse(line)
      }
      catch {
        throw new Error(`第 ${index + 1} 行不是有效的 JSON`)
      }

      if (!isGeoJsonObject(data)) {
        throw new Error(`第 ${index + 1} 行不是有效的 GeoJSON`)
      }

      return toFeatureCollection(data).features
    })

  return {
    type: 'FeatureCollection',
    features,
  }
}

export function importGeoJsonFileByFormat(file: File, format: GeoJsonImportFormat): Promise<unknown> {
  const parsers = {
    geojson: parseGeoJsonFile,
    geojsonl: parseGeoJsonLinesFile,
    shapefile: importShapefileInWorker,
  } satisfies Record<GeoJsonImportFormat, (file: File) => Promise<unknown>>

  return parsers[format](file)
}

export function normalizeImportedGeoJson(data: unknown): GeoJSON {
  if (!isGeoJsonObject(data)) {
    throw new Error('文件内容不是有效的 GeoJSON')
  }

  return data
}

export function createGeoJsonExport(data: unknown, options: GeoJsonExportOptions): GeoJsonExportResult {
  if (!isGeoJsonObject(data)) {
    throw new Error('当前内容不是有效的 GeoJSON')
  }

  const output = options.featureBbox ? withFeatureBBoxes(data) : data
  return {
    blob: new Blob([JSON.stringify(output, null, options.pretty ? 2 : undefined)], {
      type: 'application/geo+json;charset=utf-8',
    }),
    filename: 'geojson.geojson',
  }
}

export function createGeoJsonLinesExport(data: unknown): GeoJsonExportResult {
  const collection = toFeatureCollection(data)
  if (!collection.features.length) {
    throw new Error('当前没有可导出的图斑')
  }

  return {
    blob: new Blob([collection.features.map(feature => JSON.stringify(feature)).join('\n')], {
      type: 'application/x-ndjson;charset=utf-8',
    }),
    filename: 'geojson.geojsonl',
  }
}

export function createShapefileSource(data: unknown) {
  const collection = toFeatureCollection(data)
  if (!collection.features.length) {
    throw new Error('当前没有可导出的图斑')
  }

  return collection
}

export async function exportGeoJsonFile(data: unknown, options: GeoJsonExportOptions): Promise<GeoJsonExportResult> {
  const exporters = {
    geojson: () => createGeoJsonExport(data, options),
    geojsonl: () => createGeoJsonLinesExport(data),
    shapefile: async () => {
      const buffer = await exportShapefileInWorker(createShapefileSource(data))
      return {
        blob: new Blob([buffer], { type: 'application/zip' }),
        filename: 'shapefile.zip',
      }
    },
  } satisfies Record<GeoJsonExportOptions['format'], () => GeoJsonExportResult | Promise<GeoJsonExportResult>>

  return exporters[options.format]()
}

export function mergeGeoJsonList(items: unknown[]) {
  return {
    type: 'FeatureCollection',
    features: items.flatMap(item => toFeatureCollection(item).features),
  }
}

function withFeatureBBoxes(data: GeoJSON): GeoJSON {
  if (data.type === 'Feature') {
    return withFeatureBBox(data)
  }

  if (data.type === 'FeatureCollection') {
    return {
      ...data,
      features: data.features.map(feature => withFeatureBBox(feature)),
    }
  }

  return data
}

function withFeatureBBox(feature: Feature): Feature {
  const bbox = getGeometryBBox(feature.geometry)
  if (!bbox) {
    return feature
  }

  return {
    ...feature,
    bbox,
  }
}

function getGeometryBBox(geometry: Geometry | null | undefined): [number, number, number, number] | undefined {
  if (!geometry) {
    return undefined
  }

  const bbox: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity]
  collectGeometryBBox(geometry, bbox)

  return Number.isFinite(bbox[0]) ? bbox : undefined
}

function collectGeometryBBox(geometry: Geometry, bbox: [number, number, number, number]) {
  if (geometry.type === 'GeometryCollection') {
    for (const item of geometry.geometries) {
      if (isGeometry(item)) {
        collectGeometryBBox(item, bbox)
      }
    }
    return
  }

  collectCoordinatesBBox((geometry as { coordinates?: unknown }).coordinates, bbox)
}

function collectCoordinatesBBox(value: unknown, bbox: [number, number, number, number]) {
  if (!Array.isArray(value)) {
    return
  }

  if (typeof value[0] === 'number' && typeof value[1] === 'number') {
    bbox[0] = Math.min(bbox[0], value[0])
    bbox[1] = Math.min(bbox[1], value[1])
    bbox[2] = Math.max(bbox[2], value[0])
    bbox[3] = Math.max(bbox[3], value[1])
    return
  }

  for (const item of value) {
    collectCoordinatesBBox(item, bbox)
  }
}
