export { getUploader, getUploaderOptions, uploaders } from './uploaders'
/**
 * 重新导出 uploaders 中的核心类型，让外部文件可以继续从此处 import。
 * ImgHostingConfig 现在是 UploaderConfig 的别名，完全向后兼容。
 */
export type { UploaderConfig as ImgHostingConfig, FileItem as ImgHostingFileItem } from './uploaders/types'
