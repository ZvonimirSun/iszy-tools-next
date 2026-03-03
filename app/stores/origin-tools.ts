import type { ToolMenu } from '#shared/types/tool'
import type { ResultDto } from '@zvonimirsun/iszy-common'

export const useOriginToolsStore = defineStore('originTools', {
  state: () => ({
    toolMenus: [] as ToolMenu[],
  }),
  getters: {
    toolItems(): ToolItem[] {
      return this.toolMenus.map((item: ToolMenu) => {
        return item.children
      }).flat()
    },
  },
  actions: {
    async init(headers?: any) {
      if (this.toolMenus.length) {
        return
      }
      await this.fetchTools(headers)
    },
    async fetchTools(headers?: any) {
      this.toolMenus = (await $fetch<ResultDto<ToolMenu[]>>('/api/tools', {
        headers,
      })).data || []
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOriginToolsStore, import.meta.hot))
}
