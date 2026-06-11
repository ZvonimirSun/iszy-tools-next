import type { IdChineseRegion } from './idChinese.types'
import areaDataRaw from 'china-area-data/data.json'

type AreaChildren = Record<string, string>
type AreaDataMap = Record<string, AreaChildren>

const areaData = areaDataRaw as AreaDataMap
const provinceMap = areaData['86'] || {}

function getChildren(code: string): AreaChildren {
  return areaData[code] || {}
}

function compactAddressNames(names: string[]): string {
  return names.filter((name, index, arr) => Boolean(name) && arr.indexOf(name) === index).join(' ')
}

export function resolveRegionByAddressCode(addressCode: string): IdChineseRegion {
  const provinceCode = `${addressCode.slice(0, 2)}0000`
  const cityCode = `${addressCode.slice(0, 4)}00`
  const districtCode = addressCode

  const provinceName = provinceMap[provinceCode] || ''

  const cityMap = getChildren(provinceCode)
  const cityNameRaw = cityMap[cityCode] || ''
  const cityName = (cityNameRaw === '市辖区' || cityNameRaw === '县') ? provinceName : cityNameRaw

  const districtMap = getChildren(cityCode)
  let districtName = districtMap[districtCode] || ''

  if (!districtName && districtCode === cityCode) {
    districtName = cityNameRaw || cityName
  }

  return {
    addressCode,
    provinceCode,
    cityCode,
    districtCode,
    provinceName,
    cityName,
    districtName,
    cityNameRaw,
    fullName: compactAddressNames([provinceName, cityName, districtName]),
    isProvinceMatched: Boolean(provinceName),
    isCityMatched: Boolean(cityNameRaw),
    isDistrictMatched: Boolean(districtName),
  }
}
