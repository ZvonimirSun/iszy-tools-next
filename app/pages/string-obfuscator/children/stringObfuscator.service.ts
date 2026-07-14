export interface ObfuscateOptions {
  keepStart: number
  keepEnd: number
  maskChar: string
  perLine: boolean
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

  if (chars.length <= keepStart + keepEnd) {
    return maskChar.repeat(chars.length)
  }

  return [
    chars.slice(0, keepStart).join(''),
    maskChar.repeat(chars.length - keepStart - keepEnd),
    keepEnd ? chars.slice(-keepEnd).join('') : '',
  ].join('')
}
