import type { ToolMenu } from '#shared/types/tool'
import { flatten } from 'lodash-es'

export const useOriginToolsStore = defineStore('originTools', {
  state: () => ({
    toolMenus: [] as ToolMenu[],
  }),
  getters: {
    toolItems(): ToolItem[] {
      return flatten(this.toolMenus.map((item: ToolMenu) => {
        return item.children
      }))
    },
  },
  actions: {
    async init() {
      if (this.toolMenus.length) {
        return
      }
      await this.fetchTools()
    },
    async fetchTools() {
      this.toolMenus = await $fetch('/api/tools')
    },
  },
})
