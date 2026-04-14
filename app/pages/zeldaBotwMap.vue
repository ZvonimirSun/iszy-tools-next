<script setup lang="ts">
import type { Map } from '@zvonimirsun/map-sdk/2d'
import 'leaflet/dist/leaflet.css'

const mapContainer = useTemplateRef('mapContainer')
const map = shallowRef<Map>()

onMounted(async () => {
  const [
    { LayerUtils, MapUtils, ViewUtils },
    { CRS, LatLng, LatLngBounds },
  ] = await Promise.all([
    import('@zvonimirsun/map-sdk/2d'),
    import('leaflet'),
  ])
  if (!mapContainer.value) {
    return
  }

  map.value = MapUtils.createMap(mapContainer.value, {
    mapConfig: {
      crs: CRS.Simple,
      maxBoundsViscosity: 1.0,
      trackResize: true,
    },
  })

  const bounds = new LatLngBounds(
    new LatLng(-49.875, 34.25),
    new LatLng(-206, 221),
  )

  ViewUtils.setHome(map.value, {
    center: [0, 0],
    zoom: 2,
    maxBounds: bounds,
  })

  LayerUtils.addLayer(map.value, {
    type: 'url_template',
    url: 'https://lib.demos.pub/other/zelda-botw-map/map/{z}_{x}_{y}.png',
    minZoom: 2,
    maxZoom: 7,
    noWrap: true,
    bounds,
  })
  LayerUtils.addLayer(map.value, {
    type: 'url_template',
    url: 'https://lib.demos.pub/other/zelda-botw-map/label/{z}_{x}_{y}.png',
    minZoom: 2,
    maxZoom: 7,
    noWrap: true,
    bounds,
  })
})
</script>

<template>
  <div
    ref="mapContainer"
    class="h-full w-full bg-black! z-0"
  />
</template>
