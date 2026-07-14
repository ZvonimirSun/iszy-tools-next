export interface ObfuscateOptions {
  keepStart: number
  keepEnd: number
  maskChar: string
  perLine: boolean
  keepSpaces?: boolean
}

export function obfuscateString(value: string, options: ObfuscateOptions) {
  if (options.perLine) {
    return value.split(/\r\n|\r|\n/).map(line => obfuscateSingle(line, options)).join('\n')
  }

  return obfuscateSingle(value, options)
}

function obfuscateSingle(value: string, options: ObfuscateOptions) {
  const chars = [...value]
  const keepStart = Math.max(0, Math.trunc(options.keepStart))
  const keepEnd = Math.max(0, Math.trunc(options.keepEnd))
  const maskChar = options.maskChar || '*'
  const keepSpaces = options.keepSpaces ?? true

  if (chars.length <= keepStart + keepEnd) {
    return chars.map(char => keepSpaces && char === ' ' ? char : maskChar).join('')
  }

  return chars
    .map((char, index) => {
      if (keepSpaces && char === ' ') {
        return char
      }
      return index < keepStart || index >= chars.length - keepEnd ? char : maskChar
    })
    .join('')
}
