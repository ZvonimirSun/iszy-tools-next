import type { CrsObject, Feature, FeatureCollection, GeoJSON, Geometry } from '@zvonimirsun/map-sdk/2d'

export type PropertyRow = Record<string, string | number>

export function createEmptyFeatureCollection(): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [],
  }
}

export function getFeatures(data: unknown): Feature[] {
  return toFeatureCollection(data).features
}

export function hasGeoJsonFeatures(data: unknown): boolean {
  return toFeatureCollection(data).features.length > 0
}

export function getProperties(feature: Feature): Record<string, unknown> {
  if (feature.properties && typeof feature.properties === 'object' && !Array.isArray(feature.properties)) {
    return feature.properties
  }

  return {}
}

export function normalizeGeoJsonObject(data: unknown): GeoJSON | undefined {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    }
    catch {
      return undefined
    }
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return undefined
  }

  return data as GeoJSON
}

export function isGeoJsonObject(data: unknown): data is GeoJSON {
  const geoJson = normalizeGeoJsonObject(data)

  if (!geoJson) {
    return false
  }

  return geoJson.type === 'Feature'
    || geoJson.type === 'FeatureCollection'
    || isGeometry(geoJson)
}

export function toFeatureCollection(data: unknown): FeatureCollection {
  const geoJson = normalizeGeoJsonObject(data)
  const crs = getGeoJsonCrs(geoJson)

  if (geoJson?.type === 'FeatureCollection' && Array.isArray(geoJson.features)) {
    return {
      ...geoJson,
      ...(crs ? { crs } : {}),
      type: 'FeatureCollection',
      features: geoJson.features.filter(isFeature).map(feature => normalizeFeature(feature, crs)),
    }
  }

  if (geoJson?.type === 'Feature') {
    const feature = geoJson
    return {
      ...(crs ? { crs } : {}),
      type: 'FeatureCollection',
      features: [normalizeFeature(feature, crs)],
    }
  }

  if (isGeometry(geoJson)) {
    return {
      ...(crs ? { crs } : {}),
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: geoJson,
      }],
    }
  }

  return createEmptyFeatureCollection()
}

export function getGeoJsonCrs(data: unknown): CrsObject | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return undefined
  }

  return normalizeGeoJsonCrs((data as { crs?: unknown }).crs)
}

export function findGeoJsonCrs(data: unknown): CrsObject | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return undefined
  }

  const crs = getGeoJsonCrs(data)
  if (crs) {
    return crs
  }

  const item = data as {
    features?: unknown
    geometry?: unknown
    geometries?: unknown
    type?: unknown
  }

  if (item.type === 'Feature') {
    return findGeoJsonCrs(item.geometry)
  }

  if (item.type === 'FeatureCollection' && Array.isArray(item.features)) {
    return item.features.map(feature => findGeoJsonCrs(feature)).find(Boolean)
  }

  if (item.type === 'GeometryCollection' && Array.isArray(item.geometries)) {
    return item.geometries.map(geometry => findGeoJsonCrs(geometry)).find(Boolean)
  }

  return undefined
}

export function withTopLevelGeoJsonCrs<T extends GeoJSON>(geoJson: T, crs = findGeoJsonCrs(geoJson)): T {
  return crs && !getGeoJsonCrs(geoJson)
    ? {
        ...geoJson,
        crs,
      }
    : geoJson
}

function normalizeGeoJsonCrs(crs: unknown): CrsObject | undefined {
  if (!crs || typeof crs !== 'object' || Array.isArray(crs)) {
    return undefined
  }

  const type = (crs as { type?: unknown }).type
  const properties = (crs as { properties?: unknown }).properties
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return undefined
  }

  if (type === 'name' && typeof (properties as { name?: unknown }).name === 'string') {
    return crs as CrsObject
  }

  if (type === 'EPSG' && typeof (properties as { code?: unknown }).code === 'string') {
    return crs as CrsObject
  }

  return undefined
}

function normalizeFeature(feature: Feature, crs: CrsObject | undefined): Feature {
  const { crs: _featureCrs, ...rest } = feature
  return {
    ...rest,
    ...(crs ? { crs } : {}),
    properties: { ...getProperties(feature) },
  }
}

export function isFeature(value: unknown): value is Feature {
  return !!value && typeof value === 'object' && !Array.isArray(value) && (value as { type?: unknown }).type === 'Feature'
}

export function isGeometry(value: unknown): value is Geometry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  return [
    'Point',
    'MultiPoint',
    'LineString',
    'MultiLineString',
    'Polygon',
    'MultiPolygon',
    'GeometryCollection',
  ].includes((value as { type?: string }).type ?? '')
}

export function formatPropertyValue(value: unknown): string {
  if (value == null) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  try {
    return JSON.stringify(value)
  }
  catch {
    return String(value)
  }
}
