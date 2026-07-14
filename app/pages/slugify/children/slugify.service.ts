import slugify from '@sindresorhus/slugify'

export interface SlugifyOptions {
  separator?: string
  lowercase?: boolean
  keepCjk?: boolean
}

const DEFAULT_SEPARATOR = '-'

export function slugifyText(value: string, options: SlugifyOptions = {}) {
  const separator = sanitizeSeparator(options.separator ?? DEFAULT_SEPARATOR)
  const lowercase = options.lowercase ?? true

  if (!(options.keepCjk ?? true)) {
    return slugify(value, { lowercase, separator })
  }

  return slugifyKeepCjk(value, { lowercase, separator })
}

function slugifyKeepCjk(value: string, options: { separator: string, lowercase: boolean }) {
  const segments = value.match(/[\u4E00-\u9FFF]+|[^\u4E00-\u9FFF]+/gu) ?? []
  const separatorPattern = escapeRegExp(options.separator)

  return segments
    .map((segment) => {
      if (/^[\u4E00-\u9FFF]+$/u.test(segment)) {
        return segment
      }

      return slugify(segment, {
        lowercase: options.lowercase,
        separator: options.separator,
      })
    })
    .filter(Boolean)
    .join(options.separator)
    .replace(new RegExp(`${separatorPattern}+`, 'g'), options.separator)
    .replace(new RegExp(`^${separatorPattern}|${separatorPattern}$`, 'g'), '')
}

function sanitizeSeparator(separator: string) {
  const value = separator.trim()
  return value || DEFAULT_SEPARATOR
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
