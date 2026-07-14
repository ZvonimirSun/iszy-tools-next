import { describe, expect, it } from 'vitest'
import { createOtpAuthUri, decodeBase32, encodeBase32, generateTotp, verifyTotp } from './otp.service'

describe('otp.service', () => {
  it('base32 编解码可往返', () => {
    const bytes = new TextEncoder().encode('hello')
    const encoded = encodeBase32(bytes)

    expect(encoded).toBe('NBSWY3DP')
    expect(new TextDecoder().decode(decodeBase32(encoded))).toBe('hello')
  })

  it('生成 RFC 6238 TOTP 测试向量', async () => {
    const result = await generateTotp({
      secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
      timestamp: 59_000,
      digits: 8,
      period: 30,
      algorithm: 'SHA-1',
    })

    expect(result.token).toBe('94287082')
  })

  it('校验相邻窗口内的 TOTP', async () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
    const valid = await verifyTotp('94287082', {
      secret,
      timestamp: 60_000,
      digits: 8,
      period: 30,
      algorithm: 'SHA-1',
      window: 1,
    })

    expect(valid).toBe(true)
  })

  it('生成 otpauth URI', () => {
    expect(createOtpAuthUri({
      secret: 'abcd',
      issuer: 'ISZY',
      account: 'user@example.com',
      period: 30,
      digits: 6,
      algorithm: 'SHA-1',
    })).toBe('otpauth://totp/ISZY%3Auser%40example.com?secret=ABCD&issuer=ISZY&period=30&digits=6&algorithm=SHA1')
  })
})
