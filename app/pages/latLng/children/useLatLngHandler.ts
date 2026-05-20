import type { Marker } from 'leaflet'
import { Config, CrsUtils, MapUtils, ViewUtils } from '@zvonimirsun/map-sdk/2d'
import { control, LatLng, marker, Popup } from 'leaflet'
import { getIcon } from '~/utils/map'
import { getAddress, getLocation } from './addressUtils'
import { formatDegree } from './formatDegree'

interface DisplayEpsgCode {
  value: string
}

interface DisplayEpsgVersion {
  value: number
}

interface DisplayCoordinate {
  code: string
  x: number
  y: number
}

const builtinCrsCodes = new Set(['4326', '3857', '4490', '4610'])
const crsRegisterTasks = new Map<string, Promise<void>>()
const defaultEpsgCode = '4326'

export function useLatLngHandler(
  dom: HTMLDivElement,
  callback = Function.prototype,
  displayEpsgCode: DisplayEpsgCode = ref(defaultEpsgCode),
  displayEpsgVersion: DisplayEpsgVersion = ref(0),
) {
  Config.nonProjection = true
  const map = MapUtils.createMap(dom, {
    crs: {
      wkid: 3857,
    },
  })
  const keyword = ref('')
  const popupRenderTasks = new WeakMap<Popup, number>()
  let keywordRenderTask = 0

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
    updateKeywordFromLocation(wrapLatLng)
    locateLocation(latlng)
  })
  if ('geolocation' in window.navigator) {
    window.navigator.geolocation.getCurrentPosition((position) => {
      if (!keyword.value) {
        updateKeywordFromLocation(new LatLng(position.coords.latitude, position.coords.longitude))
      }
      ViewUtils.setCenterAndZoom(map, [position.coords.longitude, position.coords.latitude], 16)
    })
  }
  watch(() => displayEpsgCode.value, () => {
    updatePopupContent(centerMarker.getLatLng(), centerMarker.getPopup())
    if (clickMarker) {
      updateKeywordFromLocation(clickMarker.getLatLng())
      updatePopupContent(clickMarker.getLatLng(), clickMarker.getPopup())
      return
    }

    updateKeywordFromLocation(centerMarker.getLatLng())
  })

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
    popup.setContent(renderPopupContent(location, getWgs84DisplayCoordinate(location), address))
    const renderTask = (popupRenderTasks.get(popup) ?? 0) + 1
    const renderVersion = displayEpsgVersion.value
    popupRenderTasks.set(popup, renderTask)
    getDisplayCoordinate(location).then((coordinate) => {
      if (popupRenderTasks.get(popup) === renderTask && displayEpsgVersion.value === renderVersion) {
        popup.setContent(renderPopupContent(location, coordinate, address))
      }
    })
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

  async function update(val: string) {
    if (!val) {
      return
    }
    keyword.value = val
    const tmp = keyword.value.replace(/，/g, ',').split(',')
    if (tmp.length === 2) {
      const x = Number.parseFloat(tmp[0]!.trim())
      const y = Number.parseFloat(tmp[1]!.trim())
      if (!Number.isNaN(x) && !Number.isNaN(y)) {
        const latLng = await parseDisplayCoordinate(x, y)
        if (!latLng) {
          return
        }
        updateKeywordFromLocation(latLng)
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

  async function updateKeywordFromLocation(location: LatLng) {
    const renderTask = keywordRenderTask + 1
    const renderVersion = displayEpsgVersion.value
    keywordRenderTask = renderTask
    const coordinate = await getDisplayCoordinate(location.wrap())
    if (keywordRenderTask === renderTask && displayEpsgVersion.value === renderVersion) {
      keyword.value = formatCoordinateInput(coordinate)
    }
  }

  async function getDisplayCoordinate(location: LatLng): Promise<DisplayCoordinate> {
    const code = normalizeEpsgCode(displayEpsgCode.value) ?? defaultEpsgCode
    if (code === defaultEpsgCode) {
      return getWgs84DisplayCoordinate(location)
    }

    try {
      await ensureCrsRegistered(code)
      const coordinate = CrsUtils.transformPoint(defaultEpsgCode, code, [location.lng, location.lat])
      return {
        code,
        x: coordinate[0]!,
        y: coordinate[1]!,
      }
    }
    catch {
      return getWgs84DisplayCoordinate(location)
    }
  }

  async function parseDisplayCoordinate(x: number, y: number) {
    const code = normalizeEpsgCode(displayEpsgCode.value) ?? defaultEpsgCode
    if (code === defaultEpsgCode) {
      return new LatLng(y, x).wrap()
    }

    try {
      await ensureCrsRegistered(code)
      const coordinate = CrsUtils.transformPoint(code, defaultEpsgCode, [x, y])
      return new LatLng(coordinate[1]!, coordinate[0]!).wrap()
    }
    catch (error) {
      useToast().add({
        color: 'error',
        title: '坐标转换失败',
        description: (error as Error).message || `请检查 EPSG:${code} 是否正确`,
      })
      return undefined
    }
  }
}

function renderPopupContent(location: LatLng, coordinate: DisplayCoordinate, address?: string) {
  let content = coordinate.code === defaultEpsgCode
    ? renderWgs84PopupContent(location)
    : `<p>EPSG:${coordinate.code}</p><p>X: ${coordinate.x}</p><p>Y: ${coordinate.y}</p>`

  if (address) {
    content += `<p>地址: ${address}</p>`
  }

  return content
}

function renderWgs84PopupContent(location: LatLng) {
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

  return content
}

function getWgs84DisplayCoordinate(location: LatLng): DisplayCoordinate {
  return {
    code: defaultEpsgCode,
    x: location.lng,
    y: location.lat,
  }
}

function formatCoordinateInput(coordinate: DisplayCoordinate) {
  return `${coordinate.x},${coordinate.y}`
}

async function ensureCrsRegistered(code: string) {
  if (builtinCrsCodes.has(code)) {
    return
  }

  let task = crsRegisterTasks.get(code)
  if (!task) {
    task = registerEpsgCrs(code)
    crsRegisterTasks.set(code, task)
  }

  await task
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
