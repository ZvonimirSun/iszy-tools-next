export interface TokenGeneratorOptions {
  length: number
  count: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz'
const NUMBER_CHARS = '0123456789'
const SYMBOL_CHARS = '!@#$%^&*_-+=?'

export function createTokenCharset(options: Pick<TokenGeneratorOptions, 'uppercase' | 'lowercase' | 'numbers' | 'symbols'>) {
  return [
    options.uppercase ? UPPERCASE_CHARS : '',
    options.lowercase ? LOWERCASE_CHARS : '',
    options.numbers ? NUMBER_CHARS : '',
    options.symbols ? SYMBOL_CHARS : '',
  ].join('')
}

export function generateTokens(options: TokenGeneratorOptions) {
  const length = clampInteger(options.length, 1, 512)
  const count = clampInteger(options.count, 1, 1000)
  const charset = createTokenCharset(options)

  if (!charset) {
    throw new Error('请至少选择一种字符集')
  }

  return Array.from({ length: count }, () => generateToken(length, charset))
}

function generateToken(length: number, charset: string) {
  let token = ''
  for (let index = 0; index < length; index += 1) {
    token += charset[randomInt(charset.length)]
  }
  return token
}

function randomInt(maxExclusive: number) {
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive
  const buffer = new Uint32Array(1)

  while (true) {
    globalThis.crypto.getRandomValues(buffer)
    const value = buffer[0]!
    if (value < limit) {
      return value % maxExclusive
    }
  }
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(max, Math.max(min, Math.trunc(value)))
}
