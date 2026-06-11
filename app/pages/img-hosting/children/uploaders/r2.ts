import type { FieldMeta, FileItem, ProgressCallback, Uploader, UploaderConfig } from './types'
import { DeleteObjectsCommand, paginateListObjectsV2, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

// ------------------------------------------------------------------ meta

export const type = 'r2'

export const name = 'Cloudflare R2'

export const fields: FieldMeta[] = [
  { key: 'accessKeyId', label: 'Access Key ID', hint: 'R2 API Token 的 Access Key ID', required: true },
  { key: 'accessKeySecret', label: 'Access Key Secret', hint: 'R2 API Token 的 Secret Access Key', required: true, secret: true },
  { key: 'bucket', label: 'Bucket', hint: 'R2 Bucket 名称', required: true },
  { key: 'accountId', label: 'Account ID', hint: 'Cloudflare 账户 ID（在 R2 概览页右侧可找到）', required: true },
  { key: 'path', label: '存储路径', hint: '例如 img/', required: false },
  { key: 'customUrl', label: '自定义域名', hint: '例如 https://cdn.example.com（推荐配置，避免直接暴露 R2 地址）', required: false },
  { key: 'options', label: '网址后缀', hint: '例如 ?v=2', required: false },
]

// ------------------------------------------------------------------ helpers

function createClient(config: UploaderConfig): S3Client {
  const c = config.config
  return new S3Client({
    region: 'auto',
    endpoint: `https://${c.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: c.accessKeyId || '',
      secretAccessKey: c.accessKeySecret || '',
    },
  })
}

function buildUrl(config: UploaderConfig, fileKey: string): string {
  const c = config.config
  const path = (c.path || '').replace(/\/$/, '')
  const optionUrl = c.options || ''
  const filename = path ? fileKey.replace(new RegExp(`^${path}/?`), '') : fileKey
  const fullPath = path ? `${path}/${filename}` : filename

  if (c.customUrl) {
    return `${c.customUrl.replace(/\/$/, '')}/${fullPath}${optionUrl}`
  }
  // 没有自定义域名时使用 R2 公开访问地址（需在 Cloudflare 开启 Public Access）
  return `https://${c.bucket}.${c.accountId}.r2.cloudflarestorage.com/${fullPath}${optionUrl}`
}

// ------------------------------------------------------------------ interface impl

export function validate(config: UploaderConfig): string[] {
  const errors: string[] = []
  if (!config.name.trim())
    errors.push('配置名称不能为空')
  for (const f of fields.filter(f => f.required)) {
    if (!config.config[f.key]?.trim())
      errors.push(`${f.label} 不能为空`)
  }
  return errors
}

export async function upload(config: UploaderConfig, file: File, onProgress?: ProgressCallback): Promise<{ key: string, url: string }> {
  const client = createClient(config)
  const path = config.config.path || ''
  const key = path + file.name

  const task = new Upload({
    client,
    params: {
      Bucket: config.config.bucket,
      Key: key,
      Body: file,
      ContentType: file.type,
    },
  })

  if (onProgress) {
    task.on('httpUploadProgress', (progress) => {
      if (progress.total) {
        onProgress(Math.round(((progress.loaded || 0) / progress.total) * 100))
      }
    })
  }

  await task.done()
  return { key, url: buildUrl(config, key) }
}

export async function list(config: UploaderConfig): Promise<FileItem[]> {
  const client = createClient(config)
  const paginator = paginateListObjectsV2(
    { client, pageSize: 100 },
    { Bucket: config.config.bucket, Prefix: config.config.path || '' },
  )

  const objects: { Key?: string, Size?: number, LastModified?: Date }[] = []
  for await (const page of paginator) {
    objects.push(...(page.Contents || []))
  }

  return objects
    .filter(item => item.Key)
    .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0))
    .map(item => ({
      key: item.Key!,
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(0),
      url: buildUrl(config, item.Key!),
    }))
}

export async function remove(config: UploaderConfig, keys: string[]): Promise<void> {
  const client = createClient(config)
  await client.send(new DeleteObjectsCommand({
    Bucket: config.config.bucket,
    Delete: { Objects: keys.map(key => ({ Key: key })) },
  }))
}

// ------------------------------------------------------------------ export

const r2Uploader: Uploader = { type, name, fields, validate, upload, list, remove }
export default r2Uploader
