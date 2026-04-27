import type { ImgHostingConfig } from './imgHosting.d'
import { describe, expect, it } from 'vitest'
import { createDefaultConfig, validateConfig } from './imgHosting.service'
import aliyun from './uploaders/aliyun'
import s3 from './uploaders/s3'

function makeAliyunConfig(overrides: Partial<ImgHostingConfig> = {}): ImgHostingConfig {
  const { config: configOverrides, ...restOverrides } = overrides
  return {
    id: 'test-id',
    type: 'aliyun',
    name: '测试配置',
    config: {
      accessKeyId: 'ak',
      accessKeySecret: 'sk',
      bucket: 'my-bucket',
      region: 'oss-cn-beijing',
      ...configOverrides,
    },
    ...restOverrides,
  }
}

function makeS3Config(overrides: Partial<ImgHostingConfig> = {}): ImgHostingConfig {
  const { config: configOverrides, ...restOverrides } = overrides
  return {
    id: 'test-id',
    type: 's3',
    name: '测试S3',
    config: {
      accessKeyId: 'ak',
      accessKeySecret: 'sk',
      bucket: 'my-bucket',
      region: 'us-east-1',
      endpoint: 'https://s3.us-east-1.amazonaws.com',
      ...configOverrides,
    },
    ...restOverrides,
  }
}

// ------------------------------------------------------------------ validate

describe('validateConfig', () => {
  it('合法阿里云配置通过验证', () => {
    const result = validateConfig(makeAliyunConfig({ name: '我的阿里云' }))
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('合法 S3 配置通过验证', () => {
    const result = validateConfig(makeS3Config())
    expect(result.valid).toBe(true)
  })

  it('名称为空报错', () => {
    const result = validateConfig(makeAliyunConfig({ name: '  ' }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('名称'))).toBe(true)
  })

  it('阿里云缺少必填字段报错', () => {
    const result = validateConfig(makeAliyunConfig({
      name: 'test',
      config: { accessKeyId: '', accessKeySecret: 'sk', bucket: 'b', region: 'r' },
    }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Access Key ID'))).toBe(true)
  })

  it('s3 缺少 endpoint 报错', () => {
    const result = validateConfig(makeS3Config({
      config: { accessKeyId: 'ak', accessKeySecret: 'sk', bucket: 'b', region: 'r', endpoint: '' },
    }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Endpoint'))).toBe(true)
  })

  it('未知类型报错', () => {
    const result = validateConfig({ id: 'x', type: 'unknown', name: 'test', config: {} })
    expect(result.valid).toBe(false)
  })
})

// ------------------------------------------------------------------ buildUrl (via uploader internals tested indirectly)

describe('阿里云 uploader URL 构建', () => {
  // aliyun.ts 内部的 buildUrl 逻辑通过 upload 返回结果间接验证，
  // 这里直接测试 validate 覆盖 fields。
  it('阿里云 uploader 字段校验', () => {
    const errors = aliyun.validate(makeAliyunConfig({ name: 'ok' }))
    expect(errors).toHaveLength(0)
  })

  it('s3 uploader 字段校验', () => {
    const errors = s3.validate(makeS3Config())
    expect(errors).toHaveLength(0)
  })
})

// ------------------------------------------------------------------ createDefaultConfig

describe('createDefaultConfig', () => {
  it('创建默认阿里云配置', () => {
    const config = createDefaultConfig('aliyun')
    expect(config.type).toBe('aliyun')
    expect(config.id).toBeTruthy()
    expect(config.name).toBe('')
    expect(config.config).toEqual({})
  })

  it('创建默认 S3 配置', () => {
    const config = createDefaultConfig('s3')
    expect(config.type).toBe('s3')
    expect(config.id).toBeTruthy()
  })
})
