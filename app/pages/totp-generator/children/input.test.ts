import { describe, expect, it } from 'vitest'
import { generateTotp } from '../../otp/children/otp.service'
import { parseSecretInput } from './input'

// Public Bitwarden SDK test vectors, not account credentials:
// https://github.com/bitwarden/sdk-internal/blob/a249a7d8ea06fa8f82c741c79e9c3d0164673a05/crates/bitwarden-vault/src/totp.rs#L401
const secret = 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ'

describe('动态验证码输入', () => {
  it('解析小写、分组和填充的 Base32', () => {
    expect(parseSecretInput('jbsw y3dp ehpk 3pxp')[0]?.secret).toBe('JBSWY3DPEHPK3PXP')
    expect(parseSecretInput('MY======')[0]?.secret).toBe('MY')
  })

  it('解析带参数的 otpauth 链接', () => {
    expect(parseSecretInput(`otpauth://totp/ISZY%3Atest?secret=${secret}&algorithm=SHA256&digits=8&period=60`)[0]).toEqual({
      secret,
      algorithm: 'SHA-256',
      digits: 8,
      period: 60,
      label: 'ISZY:test',
    })
  })

  it('本地提取 2FA 链接和完整卡密中的密钥', () => {
    for (const input of [
      `https://2fa.live/totp/${secret}`,
      `https://example.com/?secret=${secret}`,
      `user@example.com----password!----${secret}----extra`,
      `user@example.com----password!----${secret}----https://example.com/login`,
      `user@example.com|password!|https://2fa.live/totp/${secret}|extra`,
      `账号: user@example.com\n密码: password!\n密钥: ${secret}\n备注: test`,
    ]) {
      expect(parseSecretInput(input)[0]?.secret).toBe(secret)
    }
  })

  it('返回多个候选字段而非静默选择密码', () => {
    expect(parseSecretInput(`user@example.com----ABCDEFGHIJKLMNOP----${secret}----extra`)).toHaveLength(2)
    expect(parseSecretInput(`ABCDEFGHIJKLMNOP ${secret}`)).toHaveLength(2)
  })

  it('拒绝非法输入、HOTP 和不支持的参数', () => {
    for (const input of [
      '123890!invalid',
      'A',
      'ABC',
      `密钥: ${secret}0`,
      `otpauth://hotp/test?secret=${secret}`,
      `otpauth://totp/test?secret=${secret}&period=0`,
      `otpauth://totp/test?secret=${secret}&digits=5`,
      `otpauth://totp/test?secret=${secret}&algorithm=MD5`,
      'otpauth://totp/test',
    ]) {
      expect(() => parseSecretInput(input)).toThrow()
    }
    expect(parseSecretInput('')).toEqual([])
  })
})

describe('steam 和标准验证码', () => {
  it('匹配 Bitwarden SDK / Vaultwarden Web Vault 测试向量', async () => {
    // Upstream test time: 2023-01-01T00:00:00.000Z.
    for (const prefix of ['steam://', 'StEam://']) {
      const options = parseSecretInput(`${prefix}${secret} `)[0]!
      const result = await generateTotp({ ...options, timestamp: 1672531200000 })
      expect(result.token).toBe('7W6CJ')
      expect(result.remainingSeconds).toBe(30)
    }
  })

  it('标准 6 位验证码保留前导零并按时间窗口刷新', async () => {
    const options = { secret: 'WQIQ25BRKZYCJVYP', timestamp: 1672531200000 }
    expect((await generateTotp(options)).token).toBe('194506')
    const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
    expect((await generateTotp({ secret: rfcSecret, timestamp: 1111111109000 })).token).toBe('081804')
    expect((await generateTotp({ ...options, timestamp: options.timestamp + 29000 })).token).toBe('194506')
    expect((await generateTotp({ ...options, timestamp: options.timestamp + 30000 })).token).not.toBe('194506')
  })
})
