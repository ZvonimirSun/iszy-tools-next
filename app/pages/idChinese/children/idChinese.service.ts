import type { IdChineseBirthInfo, IdChineseParseResult } from './idChinese.types'
import { resolveRegionByAddressCode } from './region-mapper'

const ID_15_PATTERN = /^\d{15}$/
const ID_18_PATTERN = /^\d{17}[\dX]$/
const CHECK_CODE_MAP = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'] as const
const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2] as const
const WEEK_DAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'] as const
const ZODIACS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const

function createEmptyResult(input: string, normalizedInput: string): IdChineseParseResult {
  return {
    input,
    normalizedInput,
    sourceType: null,
    id18: '',
    valid: false,
    errors: [],
    warnings: [],
    addressCode: '',
    region: null,
    birth: null,
    sequenceCode: '',
    gender: null,
    checksumCode: '',
    expectedChecksumCode: '',
    checksumValid: false,
    maskedId: '',
  }
}

function normalizeInput(value: string): string {
  return value.trim().replaceAll(/\s+/g, '').toUpperCase()
}

function calculateCheckCode(id17: string): string {
  const sum = id17.split('').reduce((acc, char, index) => {
    const digit = Number.parseInt(char, 10)
    return acc + digit * (WEIGHTS[index] || 0)
  }, 0)
  return CHECK_CODE_MAP[sum % 11] || ''
}

function getConstellation(month: number, day: number): string {
  const boundary = [20, 19, 21, 21, 21, 22, 23, 23, 23, 24, 23, 22]
  const signs = ['摩羯座', '水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座']
  const start = boundary[month - 1] || 1
  return day < start ? signs[month - 1] || '-' : signs[month] || '-'
}

function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function calcAge(year: number, month: number, day: number, now: Date): number {
  let age = now.getFullYear() - year
  const monthDiff = now.getMonth() + 1 - month
  const dayDiff = now.getDate() - day
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }
  return age
}

function parseBirthInfo(id18: string, now: Date): IdChineseBirthInfo | null {
  const year = Number.parseInt(id18.slice(6, 10), 10)
  const month = Number.parseInt(id18.slice(10, 12), 10)
  const day = Number.parseInt(id18.slice(12, 14), 10)

  if (!isValidDate(year, month, day)) {
    return null
  }

  const birthDate = new Date(year, month - 1, day)
  const age = calcAge(year, month, day, now)

  return {
    year,
    month,
    day,
    formatted: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    weekDay: WEEK_DAYS[birthDate.getDay()] || '-',
    age,
    isAdult: age >= 18,
    zodiac: ZODIACS[(year - 4) % 12] || '-',
    constellation: getConstellation(month, day),
  }
}

function maskId(id18: string): string {
  if (!id18) {
    return ''
  }
  return `${id18.slice(0, 6)}********${id18.slice(-4)}`
}

export function verifyChineseIdCheckCode(id18: string): boolean {
  if (!ID_18_PATTERN.test(id18)) {
    return false
  }
  const expected = calculateCheckCode(id18.slice(0, 17))
  return id18[17] === expected
}

export function convertChineseId15To18(id15: string): string {
  const id17 = `${id15.slice(0, 6)}19${id15.slice(6)}`
  return `${id17}${calculateCheckCode(id17)}`
}

export function parseChineseIdCard(input: string, now: Date = new Date()): IdChineseParseResult {
  const normalizedInput = normalizeInput(input)
  const result = createEmptyResult(input, normalizedInput)

  if (!normalizedInput) {
    return result
  }

  if (ID_15_PATTERN.test(normalizedInput)) {
    result.sourceType = '15'
    result.id18 = convertChineseId15To18(normalizedInput)
  }
  else if (ID_18_PATTERN.test(normalizedInput)) {
    result.sourceType = '18'
    result.id18 = normalizedInput
  }
  else {
    result.errors.push('身份证格式错误：请输入 15 位数字或 18 位数字/字母 X。')
    return result
  }

  result.addressCode = result.id18.slice(0, 6)
  result.sequenceCode = result.id18.slice(14, 17)
  result.checksumCode = result.id18[17] || ''
  result.expectedChecksumCode = calculateCheckCode(result.id18.slice(0, 17))
  result.checksumValid = result.checksumCode === result.expectedChecksumCode

  const sequenceLastNum = Number.parseInt(result.sequenceCode.slice(-1), 10)
  if (!Number.isNaN(sequenceLastNum)) {
    result.gender = sequenceLastNum % 2 === 0 ? '女' : '男'
  }

  result.region = resolveRegionByAddressCode(result.addressCode)

  if (!result.region.isProvinceMatched) {
    result.errors.push('地址码无效：未找到对应省份。')
  }
  else if (!result.region.isDistrictMatched) {
    result.warnings.push('地址码未匹配到完整区县，可能是旧行政区编码。')
  }

  result.birth = parseBirthInfo(result.id18, now)
  if (!result.birth) {
    result.errors.push('出生日期无效：请检查年月日是否真实存在。')
  }
  else if (result.birth.age < 0) {
    result.errors.push('出生日期无效：不应晚于当前日期。')
  }

  if (!result.checksumValid) {
    result.errors.push(`校验位错误：应为 ${result.expectedChecksumCode}，当前为 ${result.checksumCode || '-'}。`)
  }

  result.maskedId = maskId(result.id18)
  result.valid = result.errors.length === 0

  return result
}
