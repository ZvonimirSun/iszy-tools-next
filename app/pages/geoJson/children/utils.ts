import type { Feature, FeatureCollection, GeoJSON, Geometry } from '@zvonimirsun/map-sdk'

export type PropertyRow = Record<string, string | number>

export function getFeatures(data: unknown): Feature[] {
  const geoJson = normalizeGeoJsonObject(data)
  if (!geoJson) {
    return []
  }

  if (geoJson.type === 'Feature') {
    return [geoJson as Feature]
  }

  if (geoJson.type === 'FeatureCollection' && Array.isArray(geoJson.features)) {
    return geoJson.features.filter(isFeature)
  }

  return []
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

export function toFeatureCollection(data: unknown): FeatureCollection {
  const geoJson = normalizeGeoJsonObject(data)

  if (geoJson?.type === 'FeatureCollection' && Array.isArray(geoJson.features)) {
    return {
      ...geoJson,
      type: 'FeatureCollection',
      features: geoJson.features.filter(isFeature).map(feature => ({
        ...feature,
        properties: { ...getProperties(feature) },
      })),
    }
  }

  if (geoJson?.type === 'Feature') {
    const feature = geoJson
    return {
      type: 'FeatureCollection',
      features: [{
        ...feature,
        properties: { ...getProperties(feature) },
      }],
    }
  }

  if (isGeometry(geoJson)) {
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: geoJson,
      }],
    }
  }

  return {
    type: 'FeatureCollection',
    features: [],
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
