export function recordContentToEditorValue(content?: {
  text?: string
  json?: unknown
}) {
  if (!content) {
    return ''
  }

  if (typeof content.text === 'string') {
    return content.text
  }

  return content.json ?? null
}

export function valueToStoreValue(value: unknown) {
  return value
}

export function valueToText(value: unknown, indentation = 2) {
  if (typeof value === 'string') {
    return value
  }

  const space = indentation === 0 ? undefined : indentation
  return JSON.stringify(value, null, space) ?? ''
}

export function estimateTextSize(text: string) {
  return new TextEncoder().encode(text).byteLength
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function createDownloadName(name?: string) {
  const safeName = (name || 'json-document').replace(/[\\/:*?"<>|]/g, '_')
  return `${safeName}.txt`
}
