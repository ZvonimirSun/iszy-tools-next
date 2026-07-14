export interface MimeTypeItem {
  extension: string
  mime: string
  category: string
}

export const mimeTypes: MimeTypeItem[] = [
  { extension: 'html', mime: 'text/html', category: 'Web' },
  { extension: 'htm', mime: 'text/html', category: 'Web' },
  { extension: 'css', mime: 'text/css', category: 'Web' },
  { extension: 'js', mime: 'text/javascript', category: 'Web' },
  { extension: 'mjs', mime: 'text/javascript', category: 'Web' },
  { extension: 'json', mime: 'application/json', category: 'Data' },
  { extension: 'xml', mime: 'application/xml', category: 'Data' },
  { extension: 'yaml', mime: 'application/yaml', category: 'Data' },
  { extension: 'yml', mime: 'application/yaml', category: 'Data' },
  { extension: 'csv', mime: 'text/csv', category: 'Data' },
  { extension: 'txt', mime: 'text/plain', category: 'Text' },
  { extension: 'md', mime: 'text/markdown', category: 'Text' },
  { extension: 'pdf', mime: 'application/pdf', category: 'Document' },
  { extension: 'doc', mime: 'application/msword', category: 'Document' },
  { extension: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'Document' },
  { extension: 'xls', mime: 'application/vnd.ms-excel', category: 'Document' },
  { extension: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'Document' },
  { extension: 'ppt', mime: 'application/vnd.ms-powerpoint', category: 'Document' },
  { extension: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', category: 'Document' },
  { extension: 'png', mime: 'image/png', category: 'Image' },
  { extension: 'jpg', mime: 'image/jpeg', category: 'Image' },
  { extension: 'jpeg', mime: 'image/jpeg', category: 'Image' },
  { extension: 'gif', mime: 'image/gif', category: 'Image' },
  { extension: 'webp', mime: 'image/webp', category: 'Image' },
  { extension: 'svg', mime: 'image/svg+xml', category: 'Image' },
  { extension: 'ico', mime: 'image/vnd.microsoft.icon', category: 'Image' },
  { extension: 'mp3', mime: 'audio/mpeg', category: 'Audio' },
  { extension: 'wav', mime: 'audio/wav', category: 'Audio' },
  { extension: 'ogg', mime: 'audio/ogg', category: 'Audio' },
  { extension: 'mp4', mime: 'video/mp4', category: 'Video' },
  { extension: 'webm', mime: 'video/webm', category: 'Video' },
  { extension: 'mov', mime: 'video/quicktime', category: 'Video' },
  { extension: 'zip', mime: 'application/zip', category: 'Archive' },
  { extension: 'gz', mime: 'application/gzip', category: 'Archive' },
  { extension: 'tar', mime: 'application/x-tar', category: 'Archive' },
  { extension: '7z', mime: 'application/x-7z-compressed', category: 'Archive' },
  { extension: 'rar', mime: 'application/vnd.rar', category: 'Archive' },
  { extension: 'wasm', mime: 'application/wasm', category: 'Binary' },
  { extension: 'bin', mime: 'application/octet-stream', category: 'Binary' },
]

export function searchMimeTypes(query: string) {
  const normalized = normalizeQuery(query)
  if (!normalized) {
    return mimeTypes
  }

  return mimeTypes.filter(item =>
    item.extension.includes(normalized)
    || item.mime.includes(normalized)
    || item.category.toLowerCase().includes(normalized),
  )
}

export function normalizeQuery(query: string) {
  return query.trim().toLowerCase().replace(/^\./, '')
}
