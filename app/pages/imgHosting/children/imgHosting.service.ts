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
  return { valid: errors.length === 0, errors }
}

/** 创建默认空配置 */
export function createDefaultConfig(type: string = 'aliyun'): ImgHostingConfig {
  return { id: nanoid(), type, name: '', config: {} }
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
  return uploader.upload(config, file, onProgress)
}

/** 列出文件（委托给对应 uploader） */
export async function listFiles(config: ImgHostingConfig): Promise<ImgHostingFileItem[]> {
  const uploader = getUploader(config.type)
  if (!uploader)
    throw new Error(`未知的存储类型: ${config.type}`)
  return uploader.list(config)
}

/** 删除文件（委托给对应 uploader） */
export async function deleteFiles(config: ImgHostingConfig, keys: string[]): Promise<void> {
  const uploader = getUploader(config.type)
  if (!uploader)
    throw new Error(`未知的存储类型: ${config.type}`)
  return uploader.remove(config, keys)
}
