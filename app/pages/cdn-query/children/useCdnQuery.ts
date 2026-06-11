import type {
  AlgoliaHit,
  AlgoliaPackageDetail,
  AlgoliaSearchResponse,
  FlatFileItem,
  JsdelivrDirectory,
  JsdelivrFile,
} from './cdnQuery.types'
import {
  ALGOLIA_API_KEY,
  ALGOLIA_APP_ID,
  ALGOLIA_INDEX,
  PAGE_SIZE,
} from './cdnQuery.const'
import {
  createCdnUrl,
  flattenFiles,
  parseQuery,
} from './cdnQuery.utils'

export function useCdnQuery() {
  const { copy } = useCopy({ text: '链接已复制' })
  const { cdnOrigin } = usePublicConfig()

  const keyword = ref('')
  const loading = ref(false)
  const detailLoading = ref(false)
  const errorMessage = ref('')
  const pageIndex = ref(0)
  const count = ref(0)
  const result = ref<AlgoliaHit[]>([])
  const status = ref<'idle' | 'done'>('idle')

  const pkgID = ref('')
  const pkgData = ref<AlgoliaPackageDetail | null>(null)
  const version = ref('')
  const versions = ref<string[]>([])
  const defaultFile = ref('')
  const files = ref<Array<JsdelivrDirectory | JsdelivrFile>>([])

  const maxHits = computed(() => Math.min(count.value, 1000))
  const maxPage = computed(() => Math.max(1, Math.ceil(maxHits.value / PAGE_SIZE)))
  const hasPrevPage = computed(() => pageIndex.value > 0)
  const hasNextPage = computed(() => pageIndex.value + 1 < maxPage.value)
  const activeKeyword = computed(() => keyword.value.trim())
  const versionOptions = computed(() => versions.value.map(item => ({ label: item, value: item })))
  const flatFiles = computed<FlatFileItem[]>(() => flattenFiles(files.value))

  function getCorsUrl(url: string) {
    return `${cdnOrigin}/cors/${url}`
  }

  function buildCdnUrl(path = '') {
    return createCdnUrl(pkgData.value?.name, version.value, path)
  }

  async function search(nextPageIndex = 0) {
    const queryString = activeKeyword.value
    if (!queryString) {
      resetSearchState()
      return
    }

    const parsed = parseQuery(queryString)
    if (!parsed) {
      resetSearchState()
      return
    }

    loading.value = true
    errorMessage.value = ''

    try {
      const response = await $fetch<AlgoliaSearchResponse>(
        getCorsUrl(`https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Algolia-API-Key': ALGOLIA_API_KEY,
            'X-Algolia-Application-Id': ALGOLIA_APP_ID,
          },
          body: {
            query: parsed.query,
            page: nextPageIndex,
            hitsPerPage: PAGE_SIZE,
            attributesToHighlight: [],
            attributesToRetrieve: ['deprecated', 'description', 'githubRepo', 'homepage', 'keywords', 'license', 'name', 'owner', 'version'],
            analyticsTags: ['jsdelivr'],
            facetFilters: parsed.facetFilters.length ? parsed.facetFilters : undefined,
          },
        },
      )

      response.hits.sort((a, b) => {
        if (a.name === parsed.query) {
          return -1
        }
        if (b.name === parsed.query) {
          return 1
        }
        return 0
      })

      result.value = response.hits
      count.value = response.nbHits
      pageIndex.value = response.page
      status.value = 'done'
      pkgID.value = ''
    }
    catch (error) {
      result.value = []
      count.value = 0
      status.value = 'idle'
      errorMessage.value = (error as Error)?.message || '搜索失败，请稍后重试。'
    }
    finally {
      loading.value = false
    }
  }

  function searchByOwner(owner: string) {
    keyword.value = `author:${owner}`
    void search(0)
  }

  async function showDetail(objectID: string) {
    pkgID.value = objectID
    pkgData.value = null
    version.value = ''
    versions.value = []
    defaultFile.value = ''
    files.value = []
    errorMessage.value = ''
    detailLoading.value = true

    try {
      const response = await $fetch<AlgoliaSearchResponse>(
        getCorsUrl(`https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Algolia-API-Key': ALGOLIA_API_KEY,
            'X-Algolia-Application-Id': ALGOLIA_APP_ID,
          },
          body: {
            query: objectID,
            page: 0,
            hitsPerPage: 20,
            attributesToHighlight: [],
            attributesToRetrieve: ['description', 'homepage', 'license', 'name', 'owner', 'repository', 'version'],
          },
        },
      )

      const exact = response.hits.find(item => item.name === objectID)
      if (!exact?.name) {
        throw new Error('未找到该库详情')
      }

      pkgData.value = {
        objectID,
        name: exact.name,
        homepage: exact.homepage,
        description: exact.description,
        license: exact.license,
        owner: exact.owner
          ? {
              name: exact.owner.name,
              link: exact.owner.link,
            }
          : undefined,
        version: exact.version,
      }

      version.value = pkgData.value.version || ''
      await getVersionData()
    }
    catch (error) {
      errorMessage.value = (error as Error)?.message || '加载库详情失败。'
    }
    finally {
      detailLoading.value = false
    }
  }

  async function getVersionData() {
    if (!pkgData.value?.name) {
      return
    }

    const packageName = pkgData.value.name

    try {
      const listData = await $fetch<{ versions: string[] }>(
        getCorsUrl(`https://data.jsdelivr.com/v1/package/npm/${packageName}`),
      )

      versions.value = listData.versions || []

      if (!version.value || !versions.value.includes(version.value)) {
        version.value = versions.value[0] || ''
      }

      if (!version.value) {
        defaultFile.value = ''
        files.value = []
        return
      }

      const detailData = await $fetch<{
        default?: string
        files?: Array<JsdelivrDirectory | JsdelivrFile>
      }>(
        getCorsUrl(`https://data.jsdelivr.com/v1/package/npm/${packageName}@${version.value}`),
      )

      defaultFile.value = detailData.default || ''
      files.value = detailData.files || []
    }
    catch (error) {
      defaultFile.value = ''
      files.value = []
      errorMessage.value = (error as Error)?.message || '加载版本信息失败。'
    }
  }

  async function copyLink(path = '') {
    const url = buildCdnUrl(path)
    if (!url) {
      return
    }
    await copy(url)
  }

  function openLink(path = '') {
    const url = buildCdnUrl(path)
    if (!url) {
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function clearDetail() {
    pkgID.value = ''
    pkgData.value = null
    version.value = ''
    versions.value = []
    defaultFile.value = ''
    files.value = []
  }

  function resetSearchState() {
    status.value = 'idle'
    pageIndex.value = 0
    count.value = 0
    result.value = []
    clearDetail()
    errorMessage.value = ''
  }

  return {
    keyword,
    loading,
    detailLoading,
    errorMessage,
    pageIndex,
    count,
    result,
    status,
    pkgID,
    pkgData,
    version,
    versions,
    defaultFile,
    flatFiles,
    maxPage,
    hasPrevPage,
    hasNextPage,
    versionOptions,
    pageSize: PAGE_SIZE,
    search,
    searchByOwner,
    showDetail,
    getVersionData,
    copyLink,
    openLink,
    clearDetail,
    buildCdnUrl,
  }
}
