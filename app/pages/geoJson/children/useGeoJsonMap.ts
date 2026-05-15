import type { FeatureGroup, Layer, GeoJSON as LeafletGeoJSON, Map as LeafletMap } from 'leaflet'
import { Config, MapUtils, ViewUtils } from '@zvonimirsun/map-sdk/2d'
import { control, featureGroup, geoJSON, marker } from 'leaflet'
import '@zvonimirsun/leaflet-geoman'
import '@zvonimirsun/leaflet-geoman/dist/leaflet-geoman.css'

interface RenderGeoJsonResult {
  status: 'empty' | 'rendered' | 'invalid' | 'too-large'
  message?: string
}

interface GeoJsonMapOptions {
  maxTextLength?: number
  maxFeatures?: number
  maxCoordinates?: number
  onFeatureClick?: (feature: unknown) => void
  onGeoJsonChange?: (geoJson: unknown) => void
}

interface GeoJsonStats {
  featureCount: number
  coordinateCount: number
  tooLarge: boolean
}

const DEFAULT_MAX_FEATURES = 5000
const DEFAULT_MAX_COORDINATES = 200000
const DEFAULT_MAX_TEXT_LENGTH = 10 * 1024 * 1024

export function useGeoJsonMap(dom: HTMLDivElement, options: GeoJsonMapOptions = {}) {
  Config.nonProjection = true

  const map = MapUtils.createMap(dom, {
    crs: {
      wkid: 3857,
    },
  }) as unknown as LeafletMap
  const geoJsonLayerGroup = featureGroup().addTo(map)
  const markerIcon = getIcon()
  let geoJsonLayer: LeafletGeoJSON | undefined

  ViewUtils.setHome(map as never, {
    center: [105, 35],
    zoom: 4,
  })

  const layerControl = control.layers({}, {}, {
    hideSingleBase: true,
    position: 'bottomleft',
  }).addTo(map)
  addDefaultBaseLayers(map as never, layerControl)
  map.pm.setGlobalOptions({
    layerGroup: geoJsonLayerGroup,
    markerStyle: {
      icon: markerIcon,
    },
  })
  map.pm.addControls({
    position: 'topright',
    drawText: false,
    drawCircle: false,
    rotateMode: false,
    cutPolygon: false,
  })
  map.on('pm:create', (event) => {
    bindLayerChangeEvents(event.layer)
    emitGeoJsonChange()
  })
  map.on('pm:update', emitGeoJsonChange)
  map.on('pm:remove', emitGeoJsonChange)
  map.on('pm:edit', emitGeoJsonChange)

  function clearGeoJson() {
    geoJsonLayerGroup.clearLayers()
    geoJsonLayer = undefined
  }

  function renderGeoJson(data: unknown): RenderGeoJsonResult {
    clearGeoJson()

    if (data == null || data === '') {
      return { status: 'empty' }
    }

    const maxTextLength = options.maxTextLength ?? DEFAULT_MAX_TEXT_LENGTH
    if (typeof data === 'string' && data.trim().length > maxTextLength) {
      return {
        status: 'too-large',
        message: 'GeoJSON 文本过大，已停止渲染',
      }
    }

    const geoJsonData = normalizeGeoJson(data, maxTextLength)
    if (!geoJsonData) {
      return {
        status: 'invalid',
        message: '请输入有效的 GeoJSON 对象',
      }
    }

    const stats = collectStats(geoJsonData, {
      maxFeatures: options.maxFeatures ?? DEFAULT_MAX_FEATURES,
      maxCoordinates: options.maxCoordinates ?? DEFAULT_MAX_COORDINATES,
    })

    if (stats.tooLarge) {
      return {
        status: 'too-large',
        message: `GeoJSON 过大，已停止渲染（图斑 ${stats.featureCount}，坐标点 ${stats.coordinateCount}）`,
      }
    }

    try {
      geoJsonLayer = geoJSON(geoJsonData as unknown as Parameters<typeof geoJSON>[0], {
        pointToLayer(_feature, latlng) {
          return marker(latlng, { icon: markerIcon })
        },
        onEachFeature(feature, layer) {
          layer.on('click', () => {
            options.onFeatureClick?.(feature)
          })
          bindLayerChangeEvents(layer)
        },
      }).addTo(geoJsonLayerGroup as FeatureGroup)

      const bounds = geoJsonLayer.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          maxZoom: 16,
          padding: [24, 24],
        })
      }

      return { status: 'rendered' }
    }
    catch (e) {
      clearGeoJson()
      return {
        status: 'invalid',
        message: (e as Error).message || 'GeoJSON 渲染失败',
      }
    }
  }

  function destroy() {
    map.pm.removeControls()
    map.off('pm:create')
    map.off('pm:update', emitGeoJsonChange)
    map.off('pm:remove', emitGeoJsonChange)
    map.off('pm:edit', emitGeoJsonChange)
    clearGeoJson()
    map.remove()
  }

  function bindLayerChangeEvents(layer: Layer) {
    layer.on('pm:update', emitGeoJsonChange)
    layer.on('pm:remove', emitGeoJsonChange)
    layer.on('pm:edit', emitGeoJsonChange)
  }

  function emitGeoJsonChange() {
    window.requestAnimationFrame(() => {
      options.onGeoJsonChange?.(geoJsonLayerGroup.toGeoJSON())
    })
  }

  return {
    map,
    clearGeoJson,
    renderGeoJson,
    destroy,
  }
}

function normalizeGeoJson(data: unknown, maxTextLength: number): Record<string, unknown> | undefined {
  if (typeof data === 'string') {
    const val = data.trim()
    if (!val) {
      return undefined
    }

    if (val.length > maxTextLength) {
      return undefined
    }

    try {
      data = JSON.parse(val)
    }
    catch {
      return undefined
    }
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return undefined
  }

  const type = (data as { type?: unknown }).type
  if (typeof type !== 'string') {
    return undefined
  }

  return data as Record<string, unknown>
}

function collectStats(data: Record<string, unknown>, limits: { maxFeatures: number, maxCoordinates: number }): GeoJsonStats {
  const stats: GeoJsonStats = {
    featureCount: 0,
    coordinateCount: 0,
    tooLarge: false,
  }

  visitGeoJson(data, stats, limits)
  return stats
}

function visitGeoJson(value: unknown, stats: GeoJsonStats, limits: { maxFeatures: number, maxCoordinates: number }) {
  if (stats.tooLarge || !value || typeof value !== 'object') {
    return
  }

  const item = value as Record<string, unknown>
  switch (item.type) {
    case 'FeatureCollection':
      if (Array.isArray(item.features)) {
        for (const feature of item.features) {
          visitGeoJson(feature, stats, limits)
          if (stats.tooLarge) {
            return
          }
        }
      }
      break
    case 'Feature':
      stats.featureCount += 1
      if (stats.featureCount > limits.maxFeatures) {
        stats.tooLarge = true
        return
      }
      visitGeoJson(item.geometry, stats, limits)
      break
    case 'GeometryCollection':
      if (Array.isArray(item.geometries)) {
        for (const geometry of item.geometries) {
          visitGeoJson(geometry, stats, limits)
          if (stats.tooLarge) {
            return
          }
        }
      }
      break
    case 'Point':
    case 'MultiPoint':
    case 'LineString':
    case 'MultiLineString':
    case 'Polygon':
    case 'MultiPolygon':
      countCoordinates(item.coordinates, stats, limits)
      break
  }
}

function countCoordinates(value: unknown, stats: GeoJsonStats, limits: { maxFeatures: number, maxCoordinates: number }) {
  if (stats.tooLarge) {
    return
  }

  if (Array.isArray(value)) {
    if (typeof value[0] === 'number' && typeof value[1] === 'number') {
      stats.coordinateCount += 1
      if (stats.coordinateCount > limits.maxCoordinates) {
        stats.tooLarge = true
      }
      return
    }

    for (const item of value) {
      countCoordinates(item, stats, limits)
      if (stats.tooLarge) {
        return
      }
    }
  }
}
