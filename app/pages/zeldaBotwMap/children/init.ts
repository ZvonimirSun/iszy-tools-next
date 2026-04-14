import { LayerUtils, MapUtils, ViewUtils } from '@zvonimirsun/map-sdk/2d'
import { CRS, LatLng, LatLngBounds } from 'leaflet'
import 'leaflet/dist/leaflet.css'

export function initMap(div: HTMLDivElement) {
  const map = MapUtils.createMap(div, {
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

  ViewUtils.setHome(map, {
    center: [0, 0],
    zoom: 2,
    maxBounds: bounds,
  })

  LayerUtils.addLayer(map, {
    type: 'url_template',
    url: 'https://lib.demos.pub/other/zelda-botw-map/map/{z}_{x}_{y}.png',
    minZoom: 2,
    maxZoom: 7,
    noWrap: true,
    bounds,
  })
  LayerUtils.addLayer(map, {
    type: 'url_template',
    url: 'https://lib.demos.pub/other/zelda-botw-map/label/{z}_{x}_{y}.png',
    minZoom: 2,
    maxZoom: 7,
    noWrap: true,
    bounds,
  })
}
