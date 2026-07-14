import { types as extensionToMime, extensions as mimeToExtensions } from 'mime-types'

export interface MimeInfo {
  mime: string
  extensions: string[]
}

export interface ExtensionInfo {
  extension: string
  mime: string
}

export const mimeInfos: MimeInfo[] = Object.entries(mimeToExtensions)
  .map(([mime, extensions]) => ({ mime, extensions: [...extensions] }))
  .sort((left, right) => left.mime.localeCompare(right.mime))

export const extensionInfos: ExtensionInfo[] = Object.entries(extensionToMime)
  .map(([extension, mime]) => ({ extension, mime }))
  .sort((left, right) => left.extension.localeCompare(right.extension))

export function searchMimeTypes(query: string) {
  const normalized = normalizeQuery(query)
  if (!normalized) {
    return mimeInfos
  }

  return mimeInfos.filter(item =>
    item.mime.includes(normalized)
    || item.extensions.some(extension => extension.includes(normalized)),
  )
}

export function searchExtensions(query: string) {
  const normalized = normalizeQuery(query)
  if (!normalized) {
    return extensionInfos
  }

  return extensionInfos.filter(item =>
    item.extension.includes(normalized)
    || item.mime.includes(normalized),
  )
}

export function normalizeQuery(query: string) {
  return query.trim().toLowerCase().replace(/^\./, '')
}
