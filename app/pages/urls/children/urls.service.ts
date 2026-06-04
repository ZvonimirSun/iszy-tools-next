import type { ResultDto } from '@zvonimirsun/iszy-common'
import type { ShortUrlForm, ShortUrlItem, ShortUrlListData, ShortUrlListQuery } from './urls.types'

export async function fetchShortUrls(query: ShortUrlListQuery) {
  const res = await $fetch<ResultDto<ShortUrlListData>>('/api/urls/admin/urls', {
    query,
  })

  if (!res.success) {
    throw new Error(res.message || '获取短链接失败')
  }

  return res.data ?? { count: 0, rows: [] }
}

export async function createShortUrl(form: ShortUrlForm) {
  const res = await $fetch<ResultDto<null>>('/api/urls/admin/url', {
    method: 'POST',
    body: {
      url: form.url,
      keyword: form.keyword || undefined,
    },
  })

  if (!res.success) {
    throw new Error(res.message || '创建短链接失败')
  }
}

export async function updateShortUrl(item: ShortUrlItem, url: string) {
  const res = await $fetch<ResultDto<null>>(`/api/urls/admin/url/${item.keyword}`, {
    method: 'PUT',
    body: {
      url,
    },
  })

  if (!res.success) {
    throw new Error(res.message || '更新短链接失败')
  }
}

export async function deleteShortUrl(item: ShortUrlItem) {
  const res = await $fetch<ResultDto<null>>(`/api/urls/admin/url/${item.keyword}`, {
    method: 'DELETE',
  })

  if (!res.success) {
    throw new Error(res.message || '删除短链接失败')
  }
}
