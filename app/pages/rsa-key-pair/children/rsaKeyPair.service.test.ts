import { describe, expect, it } from 'vitest'
import { formatPem, generateRsaKeyPair, validateRsaModulusLength } from './rsaKeyPair.service'

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
    const decode = (pem: string) => Uint8Array.from(atob(pem.replace(/-----[^-]+-----|\s/g, '')), char => char.charCodeAt(0))
    const algorithm = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }
    const privateKey = await crypto.subtle.importKey('pkcs8', decode(result.privateKey), algorithm, false, ['sign'])
    const publicKey = await crypto.subtle.importKey('spki', decode(result.publicKey), algorithm, false, ['verify'])
    const message = new TextEncoder().encode('RSA round trip')
    const signature = await crypto.subtle.sign(algorithm, privateKey, message)
    expect(await crypto.subtle.verify(algorithm, publicKey, signature, message)).toBe(true)
    expect(await crypto.subtle.verify(algorithm, publicKey, signature, new TextEncoder().encode('tampered'))).toBe(false)
  })

  it('校验 RSA 密钥长度范围和步进', () => {
    expect(() => validateRsaModulusLength(2048)).not.toThrow()
    expect(() => validateRsaModulusLength(512)).toThrow('RSA 密钥长度必须是 1024 到 16384 之间且为 8 的倍数')
    expect(() => validateRsaModulusLength(2050)).toThrow('RSA 密钥长度必须是 1024 到 16384 之间且为 8 的倍数')
  })
})
