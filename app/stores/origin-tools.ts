import type { ResultDto } from '@zvonimirsun/iszy-common'
import type { ToolItem } from '#shared/types/tool'
import { getPublicToolMenus } from '#shared/utils/toolCatalog'

export const useOriginToolsStore = defineStore('originTools', () => {
  const toolMenus = computed(() => getPublicToolMenus())
  const memberTools = ref<ToolItem[]>([])
  const memberStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const toolItems = computed(() => [...toolMenus.value.flatMap(menu => menu.children), ...memberTools.value])
  let revision = 0
  let pending: Promise<void> | null = null

  function clearMemberTools() {
    revision++
    pending = null
    memberTools.value = []
    memberStatus.value = 'idle'
  }

  function fetchMemberTools(force = false, fetcher: Fetcher = $fetch): Promise<void> {
    if (!force && pending)
      return pending
    if (!force && memberStatus.value === 'ready')
      return Promise.resolve()
    const current = ++revision
    memberStatus.value = 'loading'
    const request = (async () => {
      try {
        const res = await fetcher<ResultDto<ToolItem[]>>('/api/tools/member')
        if (!res.success || !res.data)
          throw new Error(res.message || '获取会员应用失败')
        if (current === revision) {
          memberTools.value = res.data
          memberStatus.value = 'ready'
        }
      }
      catch (error) {
        if (current === revision) {
          memberTools.value = []
          memberStatus.value = 'error'
        }
        throw error
      }
      finally {
        if (current === revision)
          pending = null
      }
    })()
    pending = request
    return request
  }

  return { toolMenus, toolItems, memberTools, memberStatus, clearMemberTools, fetchMemberTools }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOriginToolsStore, import.meta.hot))
}
