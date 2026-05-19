import type { CrsObject, GeoJSON } from '@zvonimirsun/map-sdk/2d'
import type { Layer, GeoJSON as LeafletGeoJSON, Map as LeafletMap } from 'leaflet'
import { Config, GeojsonUtils, MapUtils, ViewUtils } from '@zvonimirsun/map-sdk/2d'
import { control, featureGroup, marker } from 'leaflet'
import { ensureGeoJsonCrsRegistered, transformFeatureCollectionToCrs } from './crs'
import { isGeoJsonObject, toFeatureCollection } from './utils'
import '@zvonimirsun/leaflet-geoman'
import '@zvonimirsun/leaflet-geoman/dist/leaflet-geoman.css'

interface RenderGeoJsonResult {
  status: 'empty' | 'rendered' | 'invalid'
  message?: string
}

interface GeoJsonMapOptions {
  onFeatureClick?: (feature: unknown, index: number) => void
  onGeoJsonChange?: (geoJson: unknown) => void
}

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
  let featureLayers: Layer[] = []
  let isRefreshingLayer = false
  let currentGeoJsonCrs: CrsObject | undefined

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
  map.on('pm:create', handleDrawCreate)
  map.on('pm:update', syncGeoJsonFromLayers)
  map.on('pm:remove', syncGeoJsonFromLayers)
  map.on('pm:edit', syncGeoJsonFromLayers)

  function handleDrawCreate(event: { layer: Layer }) {
    registerFeatureLayer(event.layer)
    bindLayerChangeEvents(event.layer)
    syncGeoJsonFromLayers()
  }

  function clearGeoJson() {
    geoJsonLayerGroup.clearLayers()
    geoJsonLayer = undefined
    featureLayers = []
  }

  async function renderGeoJson(data: unknown): Promise<RenderGeoJsonResult> {
    const geoJsonData = normalizeGeoJson(data)
    if (!geoJsonData || !isGeoJsonObject(geoJsonData)) {
      clearGeoJson()
      return { status: 'invalid' }
    }

    try {
      const collection = toFeatureCollection(geoJsonData)
      currentGeoJsonCrs = collection.crs

      if (!collection.features.length) {
        clearGeoJson()
        return { status: 'empty' }
      }

      await ensureGeoJsonCrsRegistered(collection)
      refreshGeoJsonLayer(collection, true)
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
    map.off('pm:create', handleDrawCreate)
    map.off('pm:update', syncGeoJsonFromLayers)
    map.off('pm:remove', syncGeoJsonFromLayers)
    map.off('pm:edit', syncGeoJsonFromLayers)
    clearGeoJson()
    map.remove()
  }

  function bindLayerChangeEvents(layer: Layer) {
    layer.on('pm:update', syncGeoJsonFromLayers)
    layer.on('pm:remove', () => {
      unregisterFeatureLayer(layer)
      syncGeoJsonFromLayers()
    })
    layer.on('pm:edit', syncGeoJsonFromLayers)
  }

  function registerFeatureLayer(layer: Layer) {
    if (!featureLayers.includes(layer)) {
      featureLayers.push(layer)
    }
  }

  function unregisterFeatureLayer(layer: Layer) {
    featureLayers = featureLayers.filter(item => item !== layer)
  }

  function syncGeoJsonFromLayers() {
    if (isRefreshingLayer) {
      return
    }

    window.requestAnimationFrame(() => {
      if (isRefreshingLayer) {
        return
      }

      void syncGeoJsonFromLayerGroup()
    })
  }

  async function syncGeoJsonFromLayerGroup() {
    if (isRefreshingLayer) {
      return
    }

    const geoJson = await transformFeatureCollectionToCrs(
      toFeatureCollection(geoJsonLayerGroup.toGeoJSON()),
      currentGeoJsonCrs,
    )

    currentGeoJsonCrs = geoJson.crs

    if (!geoJson.features.length) {
      clearGeoJson()
      options.onGeoJsonChange?.(geoJson)
      return
    }

    refreshGeoJsonLayer(geoJson, false)
    options.onGeoJsonChange?.(geoJson)
  }

  function locateFeature(index: number): boolean {
    const layer = featureLayers[index]
    if (!layer) {
      return false
    }

    const bounds = getLayerBounds(layer)
    if (bounds?.isValid()) {
      map.fitBounds(bounds, {
        maxZoom: 17,
        padding: [48, 48],
      })
      return true
    }

    const latLng = getLayerLatLng(layer)
    if (latLng) {
      map.setView(latLng, Math.max(map.getZoom(), 17), {
        animate: true,
      })
      return true
    }

    return false
  }

  return {
    map,
    clearGeoJson,
    renderGeoJson,
    locateFeature,
    destroy,
  }

  function refreshGeoJsonLayer(geoJson: GeoJSON, fitBounds: boolean) {
    isRefreshingLayer = true
    try {
      clearGeoJson()
      geoJsonLayer = GeojsonUtils.getGeojsonLayer(geoJson, {
        pointToLayer(_feature, latlng) {
          return marker(latlng, { icon: markerIcon })
        },
        onEachFeature(feature, layer) {
          const featureLayer = layer as unknown as Layer
          registerFeatureLayer(featureLayer)
          featureLayer.on('click', () => {
            const featureIndex = featureLayers.indexOf(featureLayer)
            options.onFeatureClick?.(feature, featureIndex)
          })
          bindLayerChangeEvents(featureLayer)
        },
      })
      geoJsonLayer.addTo(geoJsonLayerGroup)
    }
    finally {
      isRefreshingLayer = false
    }

    if (!fitBounds) {
      return
    }

    const bounds = geoJsonLayer.getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        maxZoom: 16,
        padding: [24, 24],
      })
    }
  }
}

function getLayerBounds(layer: Layer) {
  if ('getBounds' in layer && typeof layer.getBounds === 'function') {
    return layer.getBounds()
  }
}

function getLayerLatLng(layer: Layer) {
  if ('getLatLng' in layer && typeof layer.getLatLng === 'function') {
    return layer.getLatLng()
  }
}

function normalizeGeoJson(data: unknown): Record<string, unknown> | undefined {
  if (typeof data === 'string') {
    const val = data.trim()
    if (!val) {
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
