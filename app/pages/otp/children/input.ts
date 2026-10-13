import type { TotpOptions } from './otp.service'
import { decodeBase32 } from './otp.service'

export interface ParsedSecret extends TotpOptions {
  label: string
}

function base32(value: string) {
  const secret = value.replace(/\s/g, '').toUpperCase()
  if (!/^[A-Z2-7]+={0,6}$/.test(secret)) {
    throw new Error('密钥必须是 Base32 格式（字母 A–Z 和数字 2–7）')
  }
  const unpadded = secret.replace(/=+$/, '')
  if (![0, 2, 4, 5, 7].includes(unpadded.length % 8) || !decodeBase32(unpadded).length) {
    throw new Error('Base32 密钥长度不合法')
  }
  return unpadded
}

function parseLink(value: string): ParsedSecret {
  if (/^steam:\/\//i.test(value)) {
    return { secret: base32(value.slice(8)), steam: true, label: 'Steam 密钥' }
  }
  const url = new URL(value)
  if (url.protocol === 'otpauth:') {
    if (url.hostname.toLowerCase() !== 'totp') {
      throw new Error('仅支持基于时间的 TOTP 链接，不支持 HOTP')
    }
    const algorithm = (url.searchParams.get('algorithm') ?? 'SHA1').toUpperCase().replace('-', '')
    const algorithms = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA512: 'SHA-512' } as const
    if (!(algorithm in algorithms)) {
      throw new Error('不支持该链接的算法')
    }
    const period = Number(url.searchParams.get('period') ?? 30)
    const digits = Number(url.searchParams.get('digits') ?? 6)
    if (!Number.isInteger(period) || period <= 0 || ![6, 8].includes(digits)) {
      throw new Error('链接周期必须为正整数，位数必须为 6 或 8')
    }
    return {
      secret: base32(url.searchParams.get('secret') ?? ''),
      algorithm: algorithms[algorithm as keyof typeof algorithms],
      period,
      digits,
      label: decodeURIComponent(url.pathname.slice(1)) || 'otpauth 密钥',
    }
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('不支持该链接格式')
  }
  const explicitSecret = url.searchParams.get('secret') ?? url.searchParams.get('key')
  const secret = explicitSecret ?? decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) ?? '')
  if (explicitSecret === null && secret.replace(/\s|=/g, '').length < 16) {
    throw new Error('2FA 链接未包含有效密钥')
  }
  return { secret: base32(secret), label: '2FA 链接密钥' }
}

/** Only parses locally; never visits a pasted URL. Multiple candidates require selection. */
export function parseSecretInput(input: string): ParsedSecret[] {
  const value = input.trim()
  if (!value) {
    return []
  }
  const links = value.match(/(?:otpauth|steam|https?):\/\/[^\s<>"'|]+/gi)
  if (links?.length) {
    const candidates: ParsedSecret[] = []
    for (const link of links) {
      try {
        candidates.push(parseLink(link.split(/----|[,，;；]/)[0]!))
      }
      catch (error) {
        // A card can contain unrelated recovery/login URLs alongside its secret.
        if (/^(?:otpauth|steam):/i.test(link) || value === link) {
          throw error
        }
      }
    }
    if (candidates.length) {
      return candidates
    }
  }
  const labeled = [...value.matchAll(/(?:secret|密钥|秘钥|2fa|totp)\s*[:：=]\s*([^\s|,，;；]+)/gi)]
  if (labeled.length) {
    return labeled.map(match => ({ secret: base32(match[1]!.split(/----/)[0]!), label: '标记密钥' }))
  }
  if (/^[A-Z2-7]+={0,6}$/i.test(value) || /^(?:[A-Z2-7]{4}\s+)+[A-Z2-7]{2,4}={0,6}$/i.test(value)) {
    return [{ secret: base32(value), label: 'Base32 密钥' }]
  }
  const fields = value.split(/-{2,}|\|+|[\s,，;；:：]+/).filter(Boolean)
  const candidates: ParsedSecret[] = []
  fields.forEach((field, index) => {
    if (/^[A-Z2-7]{16,}={0,6}$/i.test(field)) {
      try {
        candidates.push({ secret: base32(field), label: `卡密第 ${index + 1} 个字段` })
      }
      catch { /* Ignore unrelated fields with invalid Base32 lengths. */ }
    }
  })
  if (!candidates.length) {
    throw new Error('未找到有效密钥，请单独粘贴 Base32 密钥，或使用“密钥: …”标记')
  }
  return candidates
}
