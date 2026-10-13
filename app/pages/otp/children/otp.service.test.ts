import { describe, expect, it } from 'vitest'
import { decodeBase32, generateTotp } from './otp.service'

describe('otp.service', () => {
  it('解码已知 Base32 文本', () => {
    expect(new TextDecoder().decode(decodeBase32('NBSWY3DP'))).toBe('hello')
  })

  it('生成 RFC 6238 TOTP 测试向量', async () => {
    // Public RFC 6238 Appendix B key: ASCII "12345678901234567890".
    // https://www.rfc-editor.org/rfc/rfc6238#appendix-B
    const result = await generateTotp({
      secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
      timestamp: 59_000,
      digits: 8,
      period: 30,
      algorithm: 'SHA-1',
    })

    expect(result.token).toBe('94287082')
  })
})
