import type { CrsObject, FeatureCollection, GeoJSON } from '@zvonimirsun/map-sdk/2d'
import { getGeoJsonCrs, isGeoJsonObject, normalizeGeoJsonObject, toFeatureCollection } from './geoJsonUtils'

const builtinCrsCodes = new Set(['4326', '3857', '4490', '4610'])
const crsRegisterTasks = new Map<string, Promise<void>>()

export function getGeoJsonCrsCode(data: unknown): string | undefined {
  const crs = getGeoJsonCrs(normalizeGeoJsonObject(data) ?? data)
  if (!crs) {
    return undefined
  }

  if (crs.type === 'EPSG') {
    return normalizeEpsgCode(crs.properties.code)
  }

  const name = crs.properties.name
  if (name === 'urn:ogc:def:crs:OGC:1.3:CRS84') {
    return '4326'
  }

  return normalizeEpsgCode(
    name.match(/^EPSG:(\d+)$/i)?.[1]
    ?? name.match(/^urn:ogc:def:crs:EPSG::(\d+)$/i)?.[1],
  )
}

export function createEpsgCrs(code: string): CrsObject {
  return {
    type: 'name',
    properties: {
      name: `EPSG:${code}`,
    },
  }
}

export function withGeoJsonEpsgCode(data: unknown, code: string): GeoJSON {
  const value = normalizeGeoJsonObject(data)
  const crs = createEpsgCrs(code)

  if (value && isGeoJsonObject(value)) {
    return {
      ...value,
      crs,
    }
  }

  return {
    ...toFeatureCollection(data),
    crs,
  }
}

export async function ensureGeoJsonCrsRegistered(geoJson: GeoJSON) {
  const code = getGeoJsonCrsCode(geoJson)
  if (!code || builtinCrsCodes.has(code)) {
    return
  }

  let task = crsRegisterTasks.get(code)
  if (!task) {
    task = registerEpsgCrs(code)
    crsRegisterTasks.set(code, task)
  }

  await task
}

export async function transformGeoJsonToEpsg(data: unknown, sourceCode: string, targetCode: string): Promise<FeatureCollection> {
  const sourceCrs = createEpsgCrs(sourceCode)
  const targetCrs = createEpsgCrs(targetCode)
  const sourceCollection = {
    ...toFeatureCollection(data),
    crs: sourceCrs,
  }

  await ensureGeoJsonCrsRegistered(sourceCollection)
  await ensureGeoJsonCrsRegistered({
    ...sourceCollection,
    crs: targetCrs,
  })

  const { CrsUtils } = await import('@zvonimirsun/map-sdk/2d')
  const transformed = toFeatureCollection(CrsUtils.transformGeoJSON(sourceCode, targetCode, sourceCollection))
  transformGeoJsonBBoxes(transformed, sourceCode, targetCode, CrsUtils.transformPoint)
  return {
    ...transformed,
    crs: targetCrs,
  }
}

export async function getGeoJsonCrsWkt(data: unknown): Promise<string> {
  const code = getGeoJsonCrsCode(data) ?? '4326'
  return $fetch<string>(`/api/epsg/${code}.wkt`, {
    responseType: 'text',
  })
}

export async function transformFeatureCollectionToCrs(
  collection: FeatureCollection,
  crs: CrsObject | undefined,
): Promise<FeatureCollection> {
  const target = getGeoJsonCrsCode({ crs })
  if (!target || target === '4326') {
    return crs ? { ...collection, crs } : collection
  }

  await ensureGeoJsonCrsRegistered({ ...collection, crs })
  const { CrsUtils } = await import('@zvonimirsun/map-sdk/2d')
  const transformed = toFeatureCollection(CrsUtils.transformGeoJSON(4326, target, collection))
  transformGeoJsonBBoxes(transformed, '4326', target, CrsUtils.transformPoint)
  return {
    ...transformed,
    crs,
  }
}

async function registerEpsgCrs(code: string) {
  const def = await $fetch<string>(`/api/epsg/${code}.proj4`, {
    responseType: 'text',
  })
  const { CrsUtils } = await import('@zvonimirsun/map-sdk/2d')
  CrsUtils.setCrs(Number(code), def)
}

export function normalizeEpsgCode(code: unknown) {
  const value = code == null ? undefined : String(code).trim()
  return value && /^\d+$/.test(value) ? value : undefined
}

function transformGeoJsonBBoxes(
  geoJson: GeoJSON,
  sourceCode: string,
  targetCode: string,
  transformPoint: (from: number | string, to: number | string, position: number[]) => number[],
) {
  transformItemBBox(geoJson, sourceCode, targetCode, transformPoint)

  if (geoJson.type === 'FeatureCollection') {
    for (const feature of geoJson.features) {
      transformItemBBox(feature, sourceCode, targetCode, transformPoint)
      if (feature.geometry) {
        transformGeometryBBox(feature.geometry, sourceCode, targetCode, transformPoint)
      }
    }
    return
  }

  if (geoJson.type === 'Feature') {
    if (geoJson.geometry) {
      transformGeometryBBox(geoJson.geometry, sourceCode, targetCode, transformPoint)
    }
    return
  }

  transformGeometryBBox(geoJson, sourceCode, targetCode, transformPoint)
}

function transformGeometryBBox(
  geometry: GeoJSON,
  sourceCode: string,
  targetCode: string,
  transformPoint: (from: number | string, to: number | string, position: number[]) => number[],
) {
  transformItemBBox(geometry, sourceCode, targetCode, transformPoint)

  if (geometry.type === 'GeometryCollection') {
    for (const item of geometry.geometries) {
      transformGeometryBBox(item, sourceCode, targetCode, transformPoint)
    }
  }
}

function transformItemBBox(
  item: { bbox?: unknown },
  sourceCode: string,
  targetCode: string,
  transformPoint: (from: number | string, to: number | string, position: number[]) => number[],
) {
  if (!Array.isArray(item.bbox)) {
    return
  }

  const bbox = transformBBox(item.bbox, sourceCode, targetCode, transformPoint)
  if (bbox) {
    item.bbox = bbox
  }
}

function transformBBox(
  bbox: unknown[],
  sourceCode: string,
  targetCode: string,
  transformPoint: (from: number | string, to: number | string, position: number[]) => number[],
) {
  if (bbox.length !== 4 && bbox.length !== 6) {
    return undefined
  }

  if (!bbox.every(value => typeof value === 'number' && Number.isFinite(value))) {
    return undefined
  }

  const dimension = bbox.length / 2
  const mins = bbox.slice(0, dimension) as number[]
  const maxes = bbox.slice(dimension) as number[]
  const corners = getBboxCorners(mins, maxes)
    .map(corner => transformPoint(sourceCode, targetCode, corner))
    .filter(corner => corner.length >= dimension)

  if (!corners.length) {
    return undefined
  }

  const nextMins = Array.from({ length: dimension }).fill(Infinity) as number[]
  const nextMaxes = Array.from({ length: dimension }).fill(-Infinity) as number[]
  for (const corner of corners) {
    for (let index = 0; index < dimension; index++) {
      const value = corner[index]
      if (typeof value === 'number' && Number.isFinite(value)) {
        nextMins[index] = Math.min(nextMins[index]!, value)
        nextMaxes[index] = Math.max(nextMaxes[index]!, value)
      }
    }
  }

  return nextMins.every(Number.isFinite) && nextMaxes.every(Number.isFinite)
    ? [...nextMins, ...nextMaxes]
    : undefined
}

function getBboxCorners(mins: number[], maxes: number[]) {
  const corners: number[][] = []
  const count = 2 ** mins.length
  for (let mask = 0; mask < count; mask++) {
    corners.push(mins.map((min, index) => (mask & (1 << index)) ? maxes[index]! : min))
  }
  return corners
}
