import type { ImgHostingConfig, ImgHostingFileItem } from './imgHosting.d'
import { S3Client } from '@aws-sdk/client-s3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDefaultConfig, createFileUrlResolver, getFileUrl, listFiles, uploadFile, validateConfig } from './imgHosting.service'
import r2 from './uploaders/r2'
import s3 from './uploaders/s3'

function config(type = 's3'): ImgHostingConfig {
  return {
    id: 'test',
    type,
    name: '测试私有桶',
    privateBucket: true,
    config: {
      bucket: 'test-bucket',
      region: 'us-east-1',
      endpoint: 'https://s3.us-east-1.amazonaws.com',
      accountId: 'test-account',
      accessKeyId: 'test-access-key',
      accessKeySecret: 'test-secret-key',
      customUrl: 'https://cdn.example.com',
      options: '?unsigned=1',
    },
  }
}

const file: ImgHostingFileItem = {
  key: 'images/中文 a&b.png',
  url: 'https://cdn.example.com/public.png',
  size: 123,
  lastModified: new Date(0),
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('私有桶访问', () => {
  it('新配置和缺少新字段的旧配置都默认公有', async () => {
    expect(createDefaultConfig('r2').privateBucket).toBe(false)
    const oldConfig = config()
    delete oldConfig.privateBucket
    const sign = vi.spyOn(s3, 'signUrl')
    expect(await getFileUrl(oldConfig, file)).toBe(file.url)
    expect(sign).not.toHaveBeenCalled()
  })

  it.each(['s3', 'r2'])('%s 在本地生成 GET 签名，保留对象 key，不使用自定义域名和后缀', async (type) => {
    const privateConfig = config(type)
    delete privateConfig.config.customUrl
    const send = vi.spyOn(S3Client.prototype, 'send').mockRejectedValue(new Error('不应发起存储请求'))
    const url = new URL(await getFileUrl(privateConfig, file))
    expect(url.hostname).toBe(type === 'r2'
      ? 'test-bucket.test-account.r2.cloudflarestorage.com'
      : 'test-bucket.s3.us-east-1.amazonaws.com')
    expect(decodeURIComponent(url.pathname)).toBe(`/${file.key}`)
    expect(url.searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256')
    expect(url.searchParams.get('X-Amz-Expires')).toBe('3600')
    expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[a-f0-9]{64}$/)
    expect(url.searchParams.get('x-id')).toBe('GetObject')
    expect(url.searchParams.has('unsigned')).toBe(false)
    expect(send).not.toHaveBeenCalled()
  })

  it('私有桶列举及上传只返回元数据，不签名、不保留未授权 URL', async () => {
    const privateConfig = config('r2')
    delete privateConfig.config.customUrl
    const sign = vi.spyOn(r2, 'signUrl')
    vi.spyOn(r2, 'list').mockResolvedValue([file])
    vi.spyOn(r2, 'upload').mockResolvedValue({ key: file.key, url: file.url })
    expect(await listFiles(privateConfig)).toEqual([{ ...file, url: '' }])
    expect(await uploadFile(privateConfig, new File(['image'], 'test.png'))).toEqual({ key: file.key, url: '' })
    expect(sign).not.toHaveBeenCalled()
  })

  it('私有桶配置了自定义域名时继续使用自定义域名，不生成签名', async () => {
    const sign = vi.spyOn(s3, 'signUrl')
    expect(await getFileUrl(config(), file)).toBe(file.url)
    vi.spyOn(s3, 'list').mockResolvedValue([file])
    vi.spyOn(s3, 'upload').mockResolvedValue({ key: file.key, url: file.url })
    expect(await listFiles(config())).toEqual([file])
    expect(await uploadFile(config(), new File(['image'], 'test.png'))).toEqual({ key: file.key, url: file.url })
    expect(sign).not.toHaveBeenCalled()
  })

  it('不支持签名的存储类型拒绝私有模式，不回退到公有链接', async () => {
    const privateConfig = config('aliyun')
    delete privateConfig.config.customUrl
    expect(validateConfig(privateConfig).valid).toBe(false)
    await expect(getFileUrl(privateConfig, file)).rejects.toThrow('暂不支持')
  })
})

describe('按需预览链接缓存', () => {
  it('创建解析器不签名，并发访问复用签名；到期前重新签名', async () => {
    vi.useFakeTimers()
    const privateConfig = config()
    delete privateConfig.config.customUrl
    const sign = vi.spyOn(s3, 'signUrl').mockResolvedValueOnce('signed-1').mockResolvedValueOnce('signed-2')
    const resolve = createFileUrlResolver(privateConfig)
    expect(sign).not.toHaveBeenCalled()
    expect(await Promise.all([resolve(file), resolve(file)])).toEqual(['signed-1', 'signed-1'])
    expect(sign).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(3540 * 1000)
    expect(await resolve(file)).toBe('signed-2')
  })

  it('不同配置隔离缓存，使用配置快照，不复用同名对象的旧签名', async () => {
    const sign = vi.spyOn(s3, 'signUrl').mockResolvedValue('signed')
    const original = config()
    delete original.config.customUrl
    const resolveOld = createFileUrlResolver(original)
    original.config.bucket = 'another-bucket'
    const resolveNew = createFileUrlResolver(original)
    await resolveOld(file)
    await resolveNew(file)
    expect(sign.mock.calls[0]?.[0].config.bucket).toBe('test-bucket')
    expect(sign.mock.calls[1]?.[0].config.bucket).toBe('another-bucket')
  })

  it('签名失败后可重试', async () => {
    vi.spyOn(s3, 'signUrl').mockRejectedValueOnce(new Error('签名失败')).mockResolvedValueOnce('recovered')
    const privateConfig = config()
    delete privateConfig.config.customUrl
    const resolve = createFileUrlResolver(privateConfig)
    await expect(resolve(file)).rejects.toThrow('签名失败')
    expect(await resolve(file)).toBe('recovered')
  })
})
