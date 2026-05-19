import type { CrsObject, FeatureCollection, GeoJSON } from '@zvonimirsun/map-sdk/2d'
import { CrsUtils } from '@zvonimirsun/map-sdk/2d'
import { getGeoJsonCrs, toFeatureCollection } from './utils'

const builtinCrsCodes = new Set(['4326', '3857', '4490', '4610'])
const crsRegisterTasks = new Map<string, Promise<void>>()

export function getGeoJsonCrsCode(data: unknown): string | undefined {
  const crs = getGeoJsonCrs(data)
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

export async function transformFeatureCollectionToCrs(
  collection: FeatureCollection,
  crs: CrsObject | undefined,
): Promise<FeatureCollection> {
  const target = getGeoJsonCrsCode({ crs })
  if (!target || target === '4326') {
    return crs ? { ...collection, crs } : collection
  }

  await ensureGeoJsonCrsRegistered({ ...collection, crs })
  return toFeatureCollection(CrsUtils.transformGeoJSON(4326, target, collection))
}

async function registerEpsgCrs(code: string) {
  const def = await $fetch<string>(`/api/epsg/${code}.proj4`, {
    responseType: 'text',
  })
  CrsUtils.setCrs(Number(code), def)
}

function normalizeEpsgCode(code: string | undefined) {
  const value = code?.trim()
  return value && /^\d+$/.test(value) ? value : undefined
}
