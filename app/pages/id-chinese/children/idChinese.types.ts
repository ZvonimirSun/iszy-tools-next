export interface IdChineseRegion {
  addressCode: string
  provinceCode: string
  cityCode: string
  districtCode: string
  provinceName: string
  cityName: string
  districtName: string
  cityNameRaw: string
  fullName: string
  isProvinceMatched: boolean
  isCityMatched: boolean
  isDistrictMatched: boolean
}

export interface IdChineseBirthInfo {
  year: number
  month: number
  day: number
  formatted: string
  weekDay: string
  age: number
  isAdult: boolean
  zodiac: string
  constellation: string
}

export interface IdChineseParseResult {
  input: string
  normalizedInput: string
  sourceType: '15' | '18' | null
  id18: string
  valid: boolean
  errors: string[]
  warnings: string[]
  addressCode: string
  region: IdChineseRegion | null
  birth: IdChineseBirthInfo | null
  sequenceCode: string
  gender: '男' | '女' | null
  checksumCode: string
  expectedChecksumCode: string
  checksumValid: boolean
  maskedId: string
}
