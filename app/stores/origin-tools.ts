import type { ResultDto } from '@zvonimirsun/iszy-common'
import type { ToolMenu } from '#shared/types/tool'

export const useOriginToolsStore = defineStore('originTools', () => {
  const toolMenus = ref<ToolMenu[]>([])
  const toolItems = computed<ToolItem[]>(() => {
    return toolMenus.value.map((item: ToolMenu) => {
      return item.children
    }).flat()
  })

  async function init(headers?: any) {
    if (toolMenus.value.length) {
      return
    }
    await fetchTools(headers)
  }

  async function fetchTools(headers?: any) {
    toolMenus.value = (await $fetch<ResultDto<ToolMenu[]>>('/api/tools', {
      headers,
    })).data || []
  }

  return {
    toolMenus,
    toolItems,
    init,
    fetchTools,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOriginToolsStore, import.meta.hot))
}
