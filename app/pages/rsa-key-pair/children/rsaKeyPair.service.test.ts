import { describe, expect, it } from 'vitest'
import { formatPem, generateRsaKeyPair } from './rsaKeyPair.service'

describe('rsaKeyPair.service', () => {
  it('格式化 PEM 内容', () => {
    const pem = formatPem('TEST KEY', new Uint8Array([1, 2, 3, 4]).buffer)

    expect(pem).toBe('-----BEGIN TEST KEY-----\nAQIDBA==\n-----END TEST KEY-----')
  })

  it('生成 RSA 公私钥 PEM', async () => {
    const result = await generateRsaKeyPair({ modulusLength: 1024 })

    expect(result.publicKey).toContain('-----BEGIN PUBLIC KEY-----')
    expect(result.publicKey).toContain('-----END PUBLIC KEY-----')
    expect(result.privateKey).toContain('-----BEGIN PRIVATE KEY-----')
    expect(result.privateKey).toContain('-----END PRIVATE KEY-----')
  })
})
