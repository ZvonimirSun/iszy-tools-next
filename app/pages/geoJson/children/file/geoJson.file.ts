import type { CrsObject, Feature, FeatureCollection, GeoJSON, Geometry } from '@zvonimirsun/map-sdk/2d'
import type { GeoJsonExportOptions, GeoJsonExportResult, GeoJsonImportFormat, GeoJsonImportFormatConfig } from './geoJson.types'
import { findGeoJsonCrs, getGeoJsonCrs, isGeoJsonObject, isGeometry, normalizeGeoJsonObject, toFeatureCollection, withTopLevelGeoJsonCrs } from '../utils'
import { exportShapefileInWorker, importShapefileInWorker } from './useGeoJsonFileWorkers'

const geoJsonImportFormatOrder = ['geojson', 'geojsonl', 'shapefile', 'topojson', 'wkt'] as const

export const geoJsonImportFormatConfigs = {
  geojson: {
    label: 'GeoJSON',
    readType: 'text',
    extensions: ['.geojson', '.json'],
  },
  geojsonl: {
    label: 'GeoJSONL',
    readType: 'text',
    extensions: ['.geojsonl', '.geojsons', '.ld'],
  },
  shapefile: {
    label: 'Esri Shapefile',
    readType: 'binary',
    extensions: ['.zip'],
  },
  topojson: {
    label: 'TopoJSON',
    readType: 'text',
    extensions: ['.topojson', '.json'],
  },
  wkt: {
    label: 'WKT',
    readType: 'text',
    extensions: [],
  },
} satisfies Record<GeoJsonImportFormat, GeoJsonImportFormatConfig>

export const geoJsonImportFormatItems = geoJsonImportFormatOrder.map(format => ({
  label: geoJsonImportFormatConfigs[format].label,
  value: format,
})) satisfies Array<{ label: string, value: GeoJsonImportFormat }>

export const geoJsonExportFormatItems = [
  { label: 'GeoJSON', value: 'geojson' },
  { label: 'GeoJSONL', value: 'geojsonl' },
  { label: 'Esri Shapefile', value: 'shapefile' },
  { label: 'TopoJSON', value: 'topojson' },
  { label: 'WKT', value: 'wkt' },
] satisfies Array<{ label: string, value: GeoJsonExportOptions['format'] }>

export function guessImportFormat(file: File): GeoJsonImportFormat {
  const name = file.name.toLowerCase()

  for (const format of geoJsonImportFormatOrder) {
    if (geoJsonImportFormatConfigs[format].extensions.some(extension => name.endsWith(extension))) {
      return format
    }
  }

  return 'geojson'
}

export async function parseGeoJsonFile(file: File): Promise<GeoJSON> {
  const data = JSON.parse(await file.text()) as unknown
  return normalizeImportedGeoJson(data)
}

export async function parseGeoJsonLinesFile(file: File): Promise<GeoJSON> {
  const items = (await file.text())
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
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

      return data
    })

  return normalizeImportedGeoJson(mergeGeoJsonList(items))
}

export async function parseTopoJsonFile(file: File): Promise<GeoJSON> {
  const { feature } = await import('topojson-client')
  const topology = JSON.parse(await file.text()) as { objects?: Record<string, unknown> }
  if (!topology || typeof topology !== 'object' || !topology.objects || typeof topology.objects !== 'object') {
    throw new Error('文件内容不是有效的 TopoJSON')
  }

  const geoJsonList = Object.keys(topology.objects).map((key) => {
    return feature(topology as never, key) as unknown
  })

  return normalizeImportedGeoJson(withTopLevelGeoJsonCrs(mergeGeoJsonList(geoJsonList), getGeoJsonCrs(topology)))
}

export async function parseWktFile(file: File): Promise<GeoJSON> {
  const wellknown = await import('wellknown')
  const geometry = wellknown.parse((await file.text()).trim())
  if (!geometry || !isGeometry(geometry)) {
    throw new Error('文件内容不是有效的 WKT')
  }

  return geometry
}

export function importGeoJsonFileByFormat(file: File, format: GeoJsonImportFormat): Promise<unknown> {
  const parsers = {
    geojson: parseGeoJsonFile,
    geojsonl: parseGeoJsonLinesFile,
    shapefile: importShapefileInWorker,
    topojson: parseTopoJsonFile,
    wkt: parseWktFile,
  } satisfies Record<GeoJsonImportFormat, (file: File) => Promise<unknown>>

  return parsers[format](file)
}

export function normalizeImportedGeoJson(data: unknown): GeoJSON {
  if (!isGeoJsonObject(data)) {
    throw new Error('文件内容不是有效的 GeoJSON')
  }

  return withTopLevelGeoJsonCrs(data)
}

export function createGeoJsonExport(data: unknown, options: GeoJsonExportOptions): GeoJsonExportResult {
  const geoJson = createDirectGeoJsonSource(data)
  const output = options.featureBbox ? withFeatureBBoxes(geoJson) : geoJson
  return {
    blob: new Blob([JSON.stringify(output, null, options.pretty ? 2 : undefined)], {
      type: 'application/geo+json;charset=utf-8',
    }),
    filename: 'geojson.geojson',
  }
}

export function createGeoJsonLinesExport(data: unknown): GeoJsonExportResult {
  const collection = withFeatureCrs(toFeatureCollection(data))
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

export async function createTopoJsonExport(data: unknown): Promise<GeoJsonExportResult> {
  const { topology } = await import('topojson-server')
  const geoJson = createDirectGeoJsonSource(data)
  const crs = getGeoJsonCrs(geoJson)
  const output = topology({ data: geoJson as never }) as unknown as Record<string, unknown>
  if (crs) {
    output.crs = crs
  }

  return {
    blob: new Blob([JSON.stringify(output)], {
      type: 'application/topo+json;charset=utf-8',
    }),
    filename: 'geojson.topojson',
  }
}

export async function createWktExport(data: unknown): Promise<GeoJsonExportResult> {
  const wellknown = await import('wellknown')
  const geometry = createWktGeometrySource(data)
  if (!isGeometry(geometry)) {
    throw new Error('当前没有可导出的 WKT 几何')
  }

  const wkt = wellknown.stringify(geometry as never)

  if (!wkt) {
    throw new Error('WKT 导出失败')
  }

  return {
    blob: new Blob([wkt], { type: 'text/plain;charset=utf-8' }),
    filename: 'geojson.wkt',
  }
}

export function createShapefileSource(data: unknown) {
  const collection = withFeatureCrs(toFeatureCollection(data))
  if (!collection.features.length) {
    throw new Error('当前没有可导出的图斑')
  }

  return collection
}

export function createDirectGeoJsonSource(data: unknown): GeoJSON {
  const geoJson = normalizeGeoJsonObject(data)
  if (!isGeoJsonObject(geoJson)) {
    throw new Error('当前内容不是有效的 GeoJSON')
  }

  return geoJson
}

export function createWktGeometrySource(data: unknown): Geometry {
  const geoJson = createDirectGeoJsonSource(data)

  if (isGeometry(geoJson)) {
    return geoJson
  }

  if (geoJson.type === 'Feature') {
    if (!isGeometry(geoJson.geometry)) {
      throw new Error('当前没有可导出的 WKT 几何')
    }

    return geoJson.geometry
  }

  const collection = toFeatureCollection(geoJson)
  const geometries = collection.features.map(feature => feature.geometry).filter(isGeometry)
  if (geometries.length === 1 && geometries[0]) {
    return geometries[0]
  }

  return {
    ...(collection.crs ? { crs: collection.crs } : {}),
    type: 'GeometryCollection',
    geometries,
  }
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
    topojson: () => createTopoJsonExport(data),
    wkt: () => createWktExport(data),
  } satisfies Record<GeoJsonExportOptions['format'], () => GeoJsonExportResult | Promise<GeoJsonExportResult>>

  return exporters[options.format]()
}

export function mergeGeoJsonList(items: unknown[]): FeatureCollection {
  const crs = items.map(item => findGeoJsonCrs(item)).find(Boolean)
  return {
    ...(crs ? { crs } : {}),
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

function withFeatureCrs(collection: FeatureCollection): FeatureCollection {
  const crs = collection.crs
  if (!crs) {
    return collection
  }

  return {
    ...collection,
    crs,
    features: collection.features.map(feature => withCrs(feature, crs)),
  }
}

function withCrs<T extends Feature | Geometry>(item: T, crs: CrsObject): T {
  return {
    ...item,
    crs,
  }
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
