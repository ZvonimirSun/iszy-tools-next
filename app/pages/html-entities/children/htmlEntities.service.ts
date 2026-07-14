const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;',
  '`': '&#96;',
}

const NAMED_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: '\'',
  nbsp: '\u00A0',
}

const ENCODE_REGEX = /[&<>"'`]/g
const ENTITY_REGEX = /&(#x[\da-f]+|#\d+|[a-z]+);/gi

export function encodeHtmlEntities(value: string) {
  return value.replace(ENCODE_REGEX, char => HTML_ENTITY_MAP[char] ?? char)
}

export function decodeHtmlEntities(value: string) {
  return value.replace(ENTITY_REGEX, (entity, body: string) => {
    const normalized = body.toLowerCase()

    if (normalized.startsWith('#x')) {
      return decodeCodePoint(entity, Number.parseInt(normalized.slice(2), 16))
    }

    if (normalized.startsWith('#')) {
      return decodeCodePoint(entity, Number.parseInt(normalized.slice(1), 10))
    }

    return NAMED_ENTITY_MAP[normalized] ?? entity
  })
}

function decodeCodePoint(fallback: string, codePoint: number) {
  if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10FFFF) {
    return fallback
  }

  try {
    return String.fromCodePoint(codePoint)
  }
  catch {
    return fallback
  }
}
