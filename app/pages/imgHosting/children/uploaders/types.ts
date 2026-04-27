/**
 * 图床文件条目
 */
export interface FileItem {
  key: string
  size: number
  lastModified: Date
  url: string
}

/**
 * 配置字段元数据，用于动态渲染表单
 */
export interface FieldMeta {
  key: string
  label: string
  hint?: string
  required: boolean
  /** 是否为密码字段（会显示眼睛图标） */
  secret?: boolean
}

/**
 * 存储配置（持久化到 Pinia store 的结构）
 */
export interface UploaderConfig {
  id: string
  /** 对应 uploader 的 type 字段 */
  type: string
  /** 用户自定义配置名称 */
  name: string
  /** 各字段的键值对 */
  config: Record<string, string>
}

/**
 * 上传进度回调
 */
export type ProgressCallback = (percent: number) => void

/**
 * 每种图床类型需要实现的 Uploader 接口
 *
 * 新增类型时只需在 uploaders/ 下新建一个 ts 文件，实现此接口后在 index.ts 注册即可。
 */
export interface Uploader {
  /** 类型标识符，与 UploaderConfig.type 一一对应 */
  type: string
  /** 显示名称 */
  name: string
  /** 字段元数据列表，按顺序渲染 */
  fields: FieldMeta[]
  /** 验证配置，返回错误列表（空数组表示合法） */
  validate: (config: UploaderConfig) => string[]
  /** 上传文件，返回文件 key 和访问 URL */
  upload: (config: UploaderConfig, file: File, onProgress?: ProgressCallback) => Promise<{ key: string, url: string }>
  /** 列出已上传的文件 */
  list: (config: UploaderConfig) => Promise<FileItem[]>
  /** 删除若干文件 */
  remove: (config: UploaderConfig, keys: string[]) => Promise<void>
}
