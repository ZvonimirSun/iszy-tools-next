import type { TraceMoeQuota, TraceMoeRateLimit, TraceMoeSearchResponse, TraceMoeSearchResult } from './traceMoe.types'

const TRACE_MOE_ORIGIN = 'https://api.trace.moe'

function readRateLimit(headers: Headers): TraceMoeRateLimit {
  return {
    limit: headers.get('ratelimit-limit') || headers.get('x-ratelimit-limit') || '',
    remaining: headers.get('ratelimit-remaining') || headers.get('x-ratelimit-remaining') || '',
    reset: headers.get('ratelimit-reset') || headers.get('x-ratelimit-reset') || '',
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null) as T | null

  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data
      ? String((data as { error?: unknown }).error || '请求失败')
      : `请求失败：${response.status}`
    throw new Error(message)
  }

  if (!data)
    throw new Error('接口返回为空')

  return data
}

export async function fetchTraceMoeQuota() {
  const response = await fetch(`${TRACE_MOE_ORIGIN}/me`)
  return readJson<TraceMoeQuota>(response)
}

export async function searchTraceMoeByFile(file: File): Promise<TraceMoeSearchResult> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${TRACE_MOE_ORIGIN}/search?anilistInfo`, {
    method: 'POST',
    body: formData,
  })
  const data = await readJson<TraceMoeSearchResponse>(response)

  if (data.error)
    throw new Error(data.error)

  return {
    data,
    rateLimit: readRateLimit(response.headers),
  }
}
