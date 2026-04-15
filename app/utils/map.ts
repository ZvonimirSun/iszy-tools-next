import type { Map } from '@zvonimirsun/map-sdk/2d'
import type { Control, Layer } from 'leaflet'
import { LayerUtils } from '@zvonimirsun/map-sdk/2d'
import { control, Icon, layerGroup } from 'leaflet'
import { chineseLayer } from '~/libs/leaflet.ChineseLayer'

export function addDefaultBaseLayers(map: Map, layerControl?: Control.Layers) {
  const { features: { map: { tdtToken } } } = usePublicConfig()
  layerControl = layerControl || control.layers({}, {}, {
    hideSingleBase: true,
    position: 'bottomleft',
  }).addTo(map)
  const layers = [
    {
      name: '高德矢量',
      layer: chineseLayer('GaoDe.Normal.Map', {
        attribution: '&copy; <a href="https://lbs.amap.com/pages/terms/" target="_blank">高德地图</a> 贡献者',
      }),
    },
    {
      name: '高德影像',
      layer: layerGroup([
        chineseLayer('GaoDe.Satellite.Map'),
        chineseLayer('GaoDe.Satellite.Annotation'),
      ], {
        attribution: '&copy; <a href="https://lbs.amap.com/pages/terms/" target="_blank">高德地图</a> 贡献者',
      }),
    },
    {
      name: '谷歌矢量',
      layer: chineseLayer('Google.Normal.Map', {
        attribution: '&copy; <a href="https://www.google.com/maps" target="_blank">谷歌地图</a> 贡献者',
      }),
    },
    {
      name: '谷歌影像',
      layer: layerGroup([
        chineseLayer('Google.Satellite.Map'),
        chineseLayer('Google.Satellite.Annotation'),
      ], {
        attribution: '&copy; <a href="https://www.google.com/maps" target="_blank">谷歌地图</a> 贡献者',
      }),
    },
    {
      name: 'OpenStreetMap',
      layer: LayerUtils.createLayer(map, {
        type: 'url_template',
        url: '//{s}.tile.osm.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        maxNativeZoom: 19,
        maxZoom: 20,
      }),
    },
    {
      name: '天地图矢量',
      layer: layerGroup([
        LayerUtils.createLayer(map, {
          type: 'tdt',
          layerType: 'vec',
          key: tdtToken,
        }) as Layer,
        LayerUtils.createLayer(map, {
          type: 'tdt',
          layerType: 'vec',
          isLabel: true,
          key: tdtToken,
        }) as Layer,
      ], {
        attribution: '&copy; <a href="https://www.tianditu.gov.cn/" target="_blank">天地图</a> 贡献者',
      }),
    },
    {
      name: '天地图影像',
      layer: layerGroup([
        LayerUtils.createLayer(map, {
          type: 'tdt',
          layerType: 'img',
          key: tdtToken,
        }) as Layer,
        LayerUtils.createLayer(map, {
          type: 'tdt',
          layerType: 'img',
          isLabel: true,
          key: tdtToken,
        }) as Layer,
      ], {
        attribution: '&copy; <a href="https://www.tianditu.gov.cn/" target="_blank">天地图</a> 贡献者',
      }),
    },
    {
      name: '天地图地形',
      layer: layerGroup([
        LayerUtils.createLayer(map, {
          type: 'tdt',
          layerType: 'ter',
          key: tdtToken,
        }) as Layer,
        LayerUtils.createLayer(map, {
          type: 'tdt',
          layerType: 'ter',
          isLabel: true,
          key: tdtToken,
        }) as Layer,
      ], {
        attribution: '&copy; <a href="https://www.tianditu.gov.cn/" target="_blank">天地图</a> 贡献者',
      }),
    },
  ]
  layers.forEach(({ name, layer }, index) => {
    layerControl.addBaseLayer(layer as Layer, name)
    if (index === 0) {
      layer.addTo(map)
    }
  })
}

export function getIcon(options = {}) {
  const { cdnOrigin } = usePublicConfig()

  return new Icon.Default({
    imagePath: `${cdnOrigin}/jsd/gh/zvonimirsun/leaflet-color-markers@master/img/`,
    iconUrl: 'marker-icon-blue.png',
    iconRetinaUrl: 'marker-icon-2x-blue.png',
    shadowUrl: 'marker-shadow.png',
    ...options,
  })
}
