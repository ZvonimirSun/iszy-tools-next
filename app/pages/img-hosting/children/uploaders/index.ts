/**
 * 图床 Uploader 注册表
 *
 * 新增图床类型步骤：
 * 1. 在本目录新建 `<type>.ts`，实现 `Uploader` 接口（参考 aliyun.ts / s3.ts）
 * 2. 在下方 import 并加入 `uploaders` 数组即可，其余代码无需修改
 */

import type { Uploader } from './types'
import aliyun from './aliyun'
import r2 from './r2'
import s3 from './s3'

export type { FieldMeta, FileItem, ProgressCallback, Uploader, UploaderConfig } from './types'

/** 所有已注册的 uploader，顺序决定 UI 中下拉列表的排列 */
export const uploaders: Uploader[] = [s3, aliyun, r2]

/** 根据 type 字段查找对应 uploader */
export function getUploader(type: string): Uploader | undefined {
  return uploaders.find(u => u.type === type)
}

/** 获取所有 uploader 的下拉选项（用于类型选择器） */
export function getUploaderOptions() {
  return uploaders.map(u => ({ label: u.name, value: u.type }))
}
