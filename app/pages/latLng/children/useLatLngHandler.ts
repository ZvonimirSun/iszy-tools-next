import type { Marker } from 'leaflet'
import { Config, MapUtils, ViewUtils } from '@zvonimirsun/map-sdk/2d'
import { control, LatLng, marker, Popup } from 'leaflet'
import { getIcon } from '~/utils/map'
import { getAddress, getLocation } from './addressUtils'
import { formatDegree } from './formatDegree'

export function useLatLngHandler(dom: HTMLDivElement, callback = Function.prototype) {
  Config.nonProjection = true
  const map = MapUtils.createMap(dom, {
    crs: {
      wkid: 3857,
    },
  })
  const keyword = ref('')

  watch(keyword, (val) => {
    callback(val)
  })

  const yellowIcon = getIcon({
    iconUrl: 'marker-icon-yellow.png',
    iconRetinaUrl: 'marker-icon-2x-yellow.png',
  })

  let clickMarker: Marker
  ViewUtils.setHome(map, {
    center: [105, 35],
    zoom: 4,
  })
  const layerControl = control.layers({}, {}, {
    hideSingleBase: true,
    position: 'bottomleft',
  }).addTo(map)
  addDefaultBaseLayers(map, layerControl)
  const centerMarker = marker(map.getCenter(), { icon: getIcon() })
    .addTo(map)
    .bindPopup(updatePopupContent(map.getCenter()))
    .on('popupopen', () => {
      if (clickMarker) {
        clickMarker.closePopup()
      }
    })
    .openPopup()
  map.on('move', () => {
    if (!centerMarker) {
      return
    }
    window.requestAnimationFrame(() => {
      const center = map.getCenter()
      centerMarker.setLatLng(center)
      updatePopupContent(center, centerMarker.getPopup())
    })
  })
  map.on('click', ({ latlng }: { latlng: LatLng }) => {
    const wrapLatLng = latlng.wrap()
    keyword.value = `${wrapLatLng.lng},${wrapLatLng.lat}`
    locateLocation(latlng)
  })
  if ('geolocation' in window.navigator) {
    window.navigator.geolocation.getCurrentPosition((position) => {
      if (!keyword.value) {
        keyword.value = `${position.coords.longitude},${position.coords.latitude}`
      }
      ViewUtils.setCenterAndZoom(map, [position.coords.longitude, position.coords.latitude], 16)
    })
  }

  function updatePopupContent(location: LatLng, popup?: Popup, address?: string): Popup {
    if (!popup) {
      popup = new Popup({
        autoPan: false,
        autoClose: false,
        closeOnEscapeKey: false,
        closeOnClick: false,
      })
    }
    location = location.wrap()
    const lat = location.lat
    const lng = location.lng
    let content = ''
    if (lat >= 0) {
      content += `<p>北纬N: ${Math.abs(lat)}</p>`
    }
    else {
      content += `<p>南纬S: ${Math.abs(lat)}</p>`
    }
    if (lng >= 0) {
      content += `<p>东经E: ${Math.abs(lng)}</p>`
    }
    else {
      content += `<p>西经W: ${Math.abs(lng)}</p>`
    }
    if (lat >= 0) {
      content += `<p>北纬N: ${formatDegree(Math.abs(lat))}</p>`
    }
    else {
      content += `<p>南纬S: ${formatDegree(Math.abs(lat))}</p>`
    }
    if (lng >= 0) {
      content += `<p>东经E: ${formatDegree(lng)}</p>`
    }
    else {
      content += `<p>西经W: ${formatDegree(lng)}</p>`
    }
    if (address) {
      content += `<p>地址: ${address}</p>`
    }
    popup.setContent(content)
    return popup
  }

  function locateLocation(location: LatLng, fly?: boolean, address?: string) {
    if (fly) {
      map.setView(location, 16)
    }
    if (!clickMarker) {
      clickMarker = marker(location, { icon: yellowIcon })
        .on('popupopen', () => {
          if (centerMarker) {
            centerMarker.closePopup()
          }
        })
        .addTo(map)
    }
    else {
      clickMarker.setLatLng(location)
    }
    if (address) {
      helper()
    }
    else {
      const index = setTimeout(() => {
        helper()
      }, 500)
      getAddress(location).then((res) => {
        clearTimeout(index)
        address = res
        helper()
      })
    }

    function helper() {
      const popup = updatePopupContent(location, clickMarker.getPopup(), address)
      if (!clickMarker.getPopup()) {
        clickMarker.bindPopup(popup)
      }
      clickMarker.openPopup()
    }
  }

  async function locateAddress(address: string) {
    try {
      const info = await getLocation(address)
      locateLocation(info.latLng, true, info.address)
    }
    catch (e) {
      useToast().add({
        color: 'error',
        title: (e as Error).message,
      })
    }
  }

  function update(val: string) {
    if (!val) {
      return
    }
    keyword.value = val
    const tmp = keyword.value.replace(/，/g, ',').split(',')
    if (tmp.length === 2) {
      const lng = Number.parseFloat(tmp[0]!.trim())
      const lat = Number.parseFloat(tmp[1]!.trim())
      if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
        // 格式满足经纬度格式
        const latLng = new LatLng(lat, lng).wrap()
        keyword.value = `${latLng.lng},${latLng.lat}`
        locateLocation(latLng, true)
        return
      }
    }
    // 不满足则走地址查询
    locateAddress(keyword.value)
  }

  return {
    keyword,
    update,
  }
}
