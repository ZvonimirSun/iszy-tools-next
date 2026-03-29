import type { AsyncData } from 'nuxt/app'
import type { FetchError } from 'ofetch'

export function handleFetchResult<T>({ error, data }: Awaited<AsyncData<T | undefined, FetchError<any> | undefined>>) {
  if (error.value) {
    throw error.value
  }
  return data.value!
}
