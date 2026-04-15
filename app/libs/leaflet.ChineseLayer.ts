import type { LatLng, Map as LeafletMap, Point, TileLayerOptions } from 'leaflet'
import { CrsUtils } from '@zvonimirsun/map-sdk/2d'
import { Bounds, Browser, DomUtil, TileLayer } from 'leaflet'

type CoordinateSystemType = 'wgs84' | 'gcj02' | 'bd09'

interface ProviderMapSet {
  [mapType: string]: string
}

interface LayerProvider {
  Subdomains: string | string[]
  tms?: boolean
  key?: string
  [mapName: string]: ProviderMapSet | string | string[] | boolean | undefined
}

interface ChineseLayerOptions extends TileLayerOptions {
  csysType?: CoordinateSystemType
}

interface TileLevel {
  origin: Point
  zoom: number
  el: HTMLElement
}

interface CenterLike {
  lng: number
  lat: number
}

interface InternalLeafletMap extends LeafletMap {
  _animatingZoom?: boolean
  _animateToZoom: number
  _getNewPixelOrigin: (center: LatLng | CenterLike, zoom: number) => Point
}

interface TileLayerWithInitialize {
  initialize: (this: TileLayer, url: string, options?: TileLayerOptions) => void
}

interface ChineseLayerInstance extends TileLayer {
  options: ChineseLayerOptions
  providers: Record<string, LayerProvider>
}

interface ChineseLayerConstructor {
  new (type: string, options?: ChineseLayerOptions): ChineseLayerInstance
}

export const ChineseLayer = TileLayer.extend({
  initialize(this: ChineseLayerInstance, type: string, options: ChineseLayerOptions = {}) { // (type, Object)
    const providers = this.providers

    const parts = type.split('.')

    const providerName = parts[0]
    const mapName = parts[1]
    const mapType = parts[2]

    if (!providerName || !mapName || !mapType) {
      throw new TypeError(`Invalid Chinese layer type: ${type}`)
    }

    const provider = providers[providerName]
    const providerMap = provider?.[mapName]

    if (!provider || !providerMap || typeof providerMap !== 'object' || Array.isArray(providerMap)) {
      throw new TypeError(`Unknown Chinese layer type: ${type}`)
    }

    const url = (providerMap as Record<string, unknown>)[mapType]

    if (typeof url !== 'string') {
      throw new TypeError(`Unknown Chinese layer type: ${type}`)
    }

    options.subdomains = provider.Subdomains

    if ('tms' in provider) {
      options.tms = provider.tms
    }

    ;(TileLayer.prototype as unknown as TileLayerWithInitialize).initialize.call(this, url, options)
  },
  providers: {
    TianDiTu: {
      Normal: {
        Map: '//t{s}.tianditu.gov.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}&tk={key}',
        Annotation: '//t{s}.tianditu.gov.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}&tk={key}',
      },
      Satellite: {
        Map: '//t{s}.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk={key}',
        Annotation: '//t{s}.tianditu.gov.cn/DataServer?T=cia_w&X={x}&Y={y}&L={z}&tk={key}',
      },
      Terrain: {
        Map: '//t{s}.tianditu.gov.cn/DataServer?T=ter_w&X={x}&Y={y}&L={z}&tk={key}',
        Annotation: '//t{s}.tianditu.gov.cn/DataServer?T=cta_w&X={x}&Y={y}&L={z}&tk={key}',
      },
      Subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      key: '',
    },

    GaoDe: {
      Normal: {
        Map: '//webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      },
      Satellite: {
        Map: '//webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        Annotation: '//webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
      },
      Subdomains: ['1', '2', '3', '4'],
    },

    Google: {
      Normal: {
        Map: '//www.google.com/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}',
      },
      Satellite: {
        Map: '//www.google.com/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}',
        Annotation: '//www.google.com/maps/vt?lyrs=y@189&gl=cn&x={x}&y={y}&z={z}',
      },
      Subdomains: [],
    },

    Geoq: {
      Normal: {
        Map: '//map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}',
        PurplishBlue: '//map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}',
        Gray: '//map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetGray/MapServer/tile/{z}/{y}/{x}',
        Warm: '//map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetWarm/MapServer/tile/{z}/{y}/{x}',
      },
      Theme: {
        Hydro: '//thematic.geoq.cn/arcgis/rest/services/ThematicMaps/WorldHydroMap/MapServer/tile/{z}/{y}/{x}',
      },
      Subdomains: [],
    },

    OSM: {
      Normal: {
        Map: '//{s}.tile.osm.org/{z}/{x}/{y}.png',
      },
      Subdomains: ['a', 'b', 'c'],
    },

    Baidu: {
      Normal: {
        Map: '//online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1',
      },
      Satellite: {
        Map: '//shangetu{s}.map.bdimg.com/it/u=x={x};y={y};z={z};v=009;type=sate&fm=46',
        Annotation: '//online{s}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=sl&v=020',
      },
      Subdomains: '0123456789',
      tms: true,
    },
  } satisfies Record<string, LayerProvider>,
  _setZoomTransform(this: ChineseLayerInstance, level: TileLevel, _center: LatLng, zoom: number) {
    const internalLayer = this as unknown as { _map: InternalLeafletMap | null }
    const map = internalLayer._map
    let center: LatLng | CenterLike = _center

    if (!map) {
      return
    }

    if (center != null && this.options) {
      if (this.options.csysType === 'gcj02') {
        const position = CrsUtils.transformPoint('wgs84', 'gcj02', [_center.lng, _center.lat]) as [number, number]
        center = {
          lng: position[0],
          lat: position[1],
        }
      }
      else if (this.options.csysType === 'bd09') {
        const position = CrsUtils.transformPoint('wgs84', 'bd09', [_center.lng, _center.lat]) as [number, number]
        center = {
          lng: position[0],
          lat: position[1],
        }
      }
    }
    const scale = map.getZoomScale(zoom, level.zoom)
    const translate = level.origin.multiplyBy(scale)
      .subtract(map._getNewPixelOrigin(center, zoom))
      .round()

    if (Browser.any3d) {
      DomUtil.setTransform(level.el, translate, scale)
    }
    else {
      DomUtil.setPosition(level.el, translate)
    }
  },
  _getTiledPixelBounds(this: ChineseLayerInstance, _center: LatLng) {
    const internalLayer = this as unknown as { _map: InternalLeafletMap | null, _tileZoom?: number }
    const map = internalLayer._map
    let center: LatLng | CenterLike = _center

    if (!map) {
      return new Bounds([0, 0], [0, 0])
    }

    if (center != null && this.options) {
      if (this.options.csysType === 'gcj02') {
        const position = CrsUtils.transformPoint('wgs84', 'gcj02', [_center.lng, _center.lat]) as [number, number]
        center = {
          lng: position[0],
          lat: position[1],
        }
      }
      else if (this.options.csysType === 'bd09') {
        const position = CrsUtils.transformPoint('wgs84', 'bd09', [_center.lng, _center.lat]) as [number, number]
        center = {
          lng: position[0],
          lat: position[1],
        }
      }
    }
    const mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom()
    const tileZoom = internalLayer._tileZoom ?? map.getZoom()
    const scale = map.getZoomScale(mapZoom, tileZoom)
    const pixelCenter = map.project(center, tileZoom).floor()
    const halfSize = map.getSize().divideBy(scale * 2)

    return new Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize))
  },
}) as unknown as ChineseLayerConstructor

export function chineseLayer(type: string, options: ChineseLayerOptions = {}) {
  const providerName = type.split('.')[0]

  if (!providerName) {
    throw new TypeError(`Invalid Chinese layer type: ${type}`)
  }

  switch (providerName) {
    case 'GaoDe':
      options = Object.assign({}, {
        maxNativeZoom: 18,
        maxZoom: 20,
      }, options)
      break
    case 'Google':
      options = Object.assign({}, {
        maxZoom: 20,
      }, options)
      break
    case 'OSM':
      options = Object.assign({}, {
        maxNativeZoom: 19,
        maxZoom: 20,
      }, options)
      break
    case 'TianDiTu':
      options = Object.assign({}, {
        maxNativeZoom: 18,
        maxZoom: 20,
      }, options)
      if (type.includes('Terrain')) {
        options.maxNativeZoom = 14
      }
      break
  }
  options.csysType = getCsysType(type)
  return new ChineseLayer(type, options)

  // 获取坐标类型
  function getCsysType(type: string): CoordinateSystemType {
    const parts = type.split('.')
    const providerName = parts[0]
    let zbName: CoordinateSystemType = 'wgs84'
    switch (providerName) {
      case 'Geoq':
      case 'GaoDe':
      case 'Google':
        zbName = 'gcj02'
        break
      case 'Baidu':
        zbName = 'bd09'
        break
      case 'OSM':
      case 'TianDiTu':
        zbName = 'wgs84'
        break
    }
    return zbName
  }
}
