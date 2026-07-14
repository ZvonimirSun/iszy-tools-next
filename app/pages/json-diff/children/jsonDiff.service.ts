import JSON5 from 'json5'

export type JsonDiffKind = 'equal' | 'change' | 'insert' | 'delete'

export interface JsonDiffRow {
  path: string
  kind: JsonDiffKind
  left: unknown
  right: unknown
}

export function diffJson(leftInput: string, rightInput: string) {
  const left = JSON5.parse(leftInput) as unknown
  const right = JSON5.parse(rightInput) as unknown
  return compareValues(left, right, '$')
}

export function createJsonDiffSummary(rows: JsonDiffRow[]) {
  return rows
    .filter(row => row.kind !== 'equal')
    .map((row) => {
      if (row.kind === 'insert') {
        return `+ ${row.path}: ${formatJsonValue(row.right)}`
      }

      if (row.kind === 'delete') {
        return `- ${row.path}: ${formatJsonValue(row.left)}`
      }

      return `~ ${row.path}: ${formatJsonValue(row.left)} -> ${formatJsonValue(row.right)}`
    })
    .join('\n')
}

export function formatJsonValue(value: unknown) {
  if (value === undefined) {
    return 'undefined'
  }

  return typeof value === 'string' ? value : JSON.stringify(value)
}

function compareValues(left: unknown, right: unknown, path: string): JsonDiffRow[] {
  if (isPlainObject(left) && isPlainObject(right)) {
    return compareObjects(left, right, path)
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return compareArrays(left, right, path)
  }

  if (Object.is(left, right)) {
    return [{ path, kind: 'equal', left, right }]
  }

  return [{ path, kind: 'change', left, right }]
}

function compareObjects(left: Record<string, unknown>, right: Record<string, unknown>, path: string) {
  const rows: JsonDiffRow[] = []
  const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort()

  for (const key of keys) {
    const nextPath = `${path}.${key}`
    const hasLeft = Object.hasOwn(left, key)
    const hasRight = Object.hasOwn(right, key)

    if (!hasLeft) {
      rows.push({ path: nextPath, kind: 'insert', left: undefined, right: right[key] })
      continue
    }

    if (!hasRight) {
      rows.push({ path: nextPath, kind: 'delete', left: left[key], right: undefined })
      continue
    }

    rows.push(...compareValues(left[key], right[key], nextPath))
  }

  return rows
}

function compareArrays(left: unknown[], right: unknown[], path: string) {
  const rows: JsonDiffRow[] = []
  const length = Math.max(left.length, right.length)

  for (let index = 0; index < length; index += 1) {
    const nextPath = `${path}[${index}]`
    const hasLeft = index < left.length
    const hasRight = index < right.length

    if (!hasLeft) {
      rows.push({ path: nextPath, kind: 'insert', left: undefined, right: right[index] })
      continue
    }

    if (!hasRight) {
      rows.push({ path: nextPath, kind: 'delete', left: left[index], right: undefined })
      continue
    }

    rows.push(...compareValues(left[index], right[index], nextPath))
  }

  return rows
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
