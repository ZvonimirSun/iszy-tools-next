export interface SlugifyOptions {
  separator?: string
  lowercase?: boolean
  keepCjk?: boolean
}

const DIACRITIC_REGEX = /[\u0300-\u036F]/g
const DEFAULT_SEPARATOR = '-'

export function slugifyText(value: string, options: SlugifyOptions = {}) {
  const separator = sanitizeSeparator(options.separator ?? DEFAULT_SEPARATOR)
  const keepCjk = options.keepCjk ?? true
  const lowercase = options.lowercase ?? true
  const allowedPattern = keepCjk ? /[^\p{Letter}\p{Number}]+/gu : /[^A-Z0-9]+/gi
  const edgeSeparatorPattern = new RegExp(`^${escapeRegExp(separator)}+|${escapeRegExp(separator)}+$`, 'g')
  const repeatedSeparatorPattern = new RegExp(`${escapeRegExp(separator)}+`, 'g')

  let result = value
    .normalize('NFKD')
    .replace(DIACRITIC_REGEX, '')
    .replace(allowedPattern, separator)
    .replace(repeatedSeparatorPattern, separator)
    .replace(edgeSeparatorPattern, '')

  if (lowercase) {
    result = result.toLowerCase()
  }

  return result
}

function sanitizeSeparator(separator: string) {
  const value = separator.trim()
  return value || DEFAULT_SEPARATOR
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
