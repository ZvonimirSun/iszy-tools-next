import JSON5 from 'json5'

export interface JsonCsvOptions {
  delimiter?: ',' | ';' | '\t'
  includeBom?: boolean
}

export interface JsonCsvResult {
  fields: string[]
  rows: Array<Record<string, unknown>>
  csv: string
}

export function convertJsonToCsv(input: string, options: JsonCsvOptions = {}): JsonCsvResult {
  const delimiter = options.delimiter ?? ','
  const parsed = JSON5.parse(input) as unknown
  const sourceRows = normalizeRows(parsed)
  const rows = sourceRows.map(row => flattenObject(row))
  const fields = collectFields(rows)
  const csvRows = [
    fields.map(field => escapeCsvValue(field, delimiter)).join(delimiter),
    ...rows.map(row => fields.map(field => escapeCsvValue(row[field], delimiter)).join(delimiter)),
  ]
  const csv = `${options.includeBom ? '\uFEFF' : ''}${csvRows.join('\n')}`

  return {
    fields,
    rows,
    csv,
  }
}

function normalizeRows(value: unknown) {
  if (Array.isArray(value)) {
    if (!value.every(item => item !== null && typeof item === 'object' && !Array.isArray(item))) {
      throw new TypeError('JSON 数组中的每一项都必须是对象')
    }

    return value as Array<Record<string, unknown>>
  }

  if (value !== null && typeof value === 'object') {
    return [value as Record<string, unknown>]
  }

  throw new TypeError('请输入 JSON 对象或对象数组')
}

function flattenObject(value: Record<string, unknown>, prefix = '') {
  const result: Record<string, unknown> = {}

  for (const [key, item] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key

    if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
      Object.assign(result, flattenObject(item as Record<string, unknown>, path))
      continue
    }

    result[path] = Array.isArray(item) ? JSON.stringify(item) : item
  }

  return result
}

function collectFields(rows: Array<Record<string, unknown>>) {
  const fields: string[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    for (const field of Object.keys(row)) {
      if (!seen.has(field)) {
        seen.add(field)
        fields.push(field)
      }
    }
  }

  return fields
}

function escapeCsvValue(value: unknown, delimiter: string) {
  if (value === null || value === undefined) {
    return ''
  }

  const text = String(value)
  const shouldQuote = text.includes(delimiter) || /["\r\n]/.test(text)
  const escaped = text.replace(/"/g, '""')
  return shouldQuote ? `"${escaped}"` : escaped
}
