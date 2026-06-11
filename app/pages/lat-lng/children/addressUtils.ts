import { CrsUtils } from '@zvonimirsun/map-sdk/2d'
import { LatLng } from 'leaflet'

export async function getLocation(address: string): Promise<{
  latLng: LatLng
  address: string
}> {
  const {
    apiOrigin,
    features: {
      map: {
        gaodeToken,
      },
    },
  } = usePublicConfig()
  const res = await $fetch<{
    status: string
    count: number
    geocodes: [{
      location: string
      formatted_address: string
    }]
  }>(`${apiOrigin}/amap/v3/geocode/geo`, {
    query: {
      address,
      key: gaodeToken,
    },
  })
  if (res.status === '1' && Number(res.count) > 0) {
    const info = res.geocodes[0]
    const position = CrsUtils.transformPoint('gcj02', 'wgs84', info.location.split(',').map(item => Number.parseFloat(item)))
    return {
      latLng: new LatLng(position[1]!, position[0]!),
      address: info.formatted_address,
    }
  }
  else {
    throw new Error('未找到相关地址。')
  }
}

export async function getAddress(location: LatLng): Promise<string> {
  const {
    apiOrigin,
    features: {
      map: {
        gaodeToken,
      },
    },
  } = usePublicConfig()
  location = location.wrap()
  const position = CrsUtils.transformPoint('wgs84', 'gcj02', [location.lng, location.lat])
  const res = await $fetch<{
    status: string
    regeocode: {
      formatted_address: string
    }
  }>(`${apiOrigin}/amap/v3/geocode/regeo`, {
    query: {
      location: position.join(','),
      output: 'json',
      key: gaodeToken,
      homeorcorp: 1,
    },
  })
  if (res.status === '1' && res.regeocode.formatted_address) {
    return res.regeocode.formatted_address
  }
  else {
    throw new Error('未找到相关地址。')
  }
}
