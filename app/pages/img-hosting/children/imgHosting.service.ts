/**
 * imgHosting.service.ts
 *
 * 保留原有函数签名以维持向后兼容，内部实现委托给对应的 uploader。
 * 业务逻辑已迁移到 uploaders/ 目录，此文件主要用于：
 *  - 被 Vue 组件直接导入（避免大量改动组件层）
 *  - 提供 createDefaultConfig / validateConfig 等工具函数
 */

import type { ImgHostingConfig, ImgHostingFileItem } from './imgHosting.d'
import { nanoid } from 'nanoid'
import { getUploader } from './uploaders'

// ------------------------------------------------------------------ re-exports

export { getUploader, getUploaderOptions, uploaders } from './uploaders'

// ------------------------------------------------------------------ compat helpers

/** 验证配置，返回 { valid, errors } 结构（向后兼容原签名） */
export function validateConfig(config: ImgHostingConfig): { valid: boolean, errors: string[] } {
  const uploader = getUploader(config.type)
  if (!uploader) {
    return { valid: false, errors: [`未知的存储类型: ${config.type}`] }
  }
  const errors = uploader.validate(config)
  if (config.privateBucket && !uploader.signUrl)
    errors.push('当前存储类型暂不支持私有桶签名访问')
  return { valid: errors.length === 0, errors }
}

/** 创建默认空配置 */
export function createDefaultConfig(type: string = 'aliyun'): ImgHostingConfig {
  const uploader = getUploader(type)
  return { id: nanoid(), type, name: uploader?.name ?? type, privateBucket: false, config: {} }
}

export const SIGNED_URL_EXPIRES_IN = 3600

function shouldSign(config: ImgHostingConfig | null): boolean {
  return !!config?.privateBucket && !config.config.customUrl?.trim()
}

/** 仅在预览或复制时调用，不请求对象内容。 */
export async function getFileUrl(config: ImgHostingConfig | null, file: { key: string, url: string }): Promise<string> {
  if (!config || !shouldSign(config))
    return file.url
  const uploader = getUploader(config.type)
  if (!uploader?.signUrl)
    throw new Error('当前存储类型暂不支持私有桶签名访问')
  return uploader.signUrl(config, file.key, SIGNED_URL_EXPIRES_IN)
}

/** 每个列表独立缓存预览链接，配置变化时重新创建，链接到期前一分钟刷新。 */
export function createFileUrlResolver(config: ImgHostingConfig | null) {
  const snapshot = config ? { ...config, config: { ...config.config } } : null
  const cache = new Map<string, { url: Promise<string>, expiresAt: number }>()
  return (file: { key: string, url: string }): Promise<string> => {
    if (!snapshot || !shouldSign(snapshot))
      return Promise.resolve(file.url)
    const cached = cache.get(file.key)
    if (cached && cached.expiresAt > Date.now())
      return cached.url
    const entry = {
      url: getFileUrl(snapshot, file),
      expiresAt: Date.now() + (SIGNED_URL_EXPIRES_IN - 60) * 1000,
    }
    if (cache.size >= 200)
      cache.delete(cache.keys().next().value!)
    cache.set(file.key, entry)
    void entry.url.catch(() => {
      if (cache.get(file.key) === entry)
        cache.delete(file.key)
    })
    return entry.url
  }
}

// ------------------------------------------------------------------ delegate wrappers

/** 上传文件（委托给对应 uploader） */
export async function uploadFile(
  config: ImgHostingConfig,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ key: string, url: string }> {
  const uploader = getUploader(config.type)
  if (!uploader)
    throw new Error(`未知的存储类型: ${config.type}`)
  const result = await uploader.upload(config, file, onProgress)
  return shouldSign(config) ? { ...result, url: '' } : result
}

/** 列出文件（委托给对应 uploader） */
export async function listFiles(config: ImgHostingConfig): Promise<ImgHostingFileItem[]> {
  const uploader = getUploader(config.type)
  if (!uploader)
    throw new Error(`未知的存储类型: ${config.type}`)
  const files = await uploader.list(config)
  return shouldSign(config) ? files.map(file => ({ ...file, url: '' })) : files
}

/** 删除文件（委托给对应 uploader） */
export async function deleteFiles(config: ImgHostingConfig, keys: string[]): Promise<void> {
  const uploader = getUploader(config.type)
  if (!uploader)
    throw new Error(`未知的存储类型: ${config.type}`)
  return uploader.remove(config, keys)
}
