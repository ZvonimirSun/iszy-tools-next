import type { FlatFileItem, JsdelivrDirectory, JsdelivrFile } from './cdnQuery.types'

const filterMapping: Record<string, string> = {
  author: 'owner.name',
  type: 'moduleTypes',
}

export function parseQuery(queryString: string) {
  const tokens = queryString.trim().split(/\s+/).filter(Boolean)
  const queryTokens: string[] = []
  const filters: string[] = []

  for (const token of tokens) {
    const splitIndex = token.indexOf(':')
    if (splitIndex <= 0) {
      queryTokens.push(token)
      continue
    }

    const key = token.slice(0, splitIndex).trim().toLowerCase()
    const value = token.slice(splitIndex + 1).trim()
    const mappedKey = filterMapping[key]

    if (!mappedKey || !value) {
      queryTokens.push(token)
      continue
    }

    filters.push(`${mappedKey}:${value}`)
  }

  const query = queryTokens.join(' ').trim()
  if (!query) {
    return
  }

  return {
    query,
    facetFilters: filters,
  }
}

export function flattenFiles(
  list: Array<JsdelivrDirectory | JsdelivrFile>,
  parentPath = '',
  depth = 0,
): FlatFileItem[] {
  const rows: FlatFileItem[] = []

  for (const item of list) {
    const currentPath = `${parentPath}/${item.name}`

    if (item.type === 'directory') {
      rows.push({
        type: 'directory',
        name: item.name,
        path: currentPath,
        depth,
      })
      rows.push(...flattenFiles(item.files, currentPath, depth + 1))
      continue
    }

    rows.push({
      type: 'file',
      name: item.name,
      path: currentPath,
      depth,
      size: item.size,
    })
  }

  return rows
}

export function formatBytes(value?: number) {
  if (!value) {
    return '-'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let current = value
  let unitIndex = 0

  while (current >= 1024 && unitIndex < units.length - 1) {
    current /= 1024
    unitIndex += 1
  }

  return `${current.toFixed(current >= 10 ? 0 : 1)} ${units[unitIndex]}`
}

export function createCdnUrl(packageName?: string, version?: string, path = '') {
  if (!packageName || !version) {
    return ''
  }

  return `https://cdn.jsdelivr.net/npm/${packageName}@${version}${path}`
}
