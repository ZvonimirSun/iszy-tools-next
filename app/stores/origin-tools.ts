import type { ToolMenu } from '#shared/types/tool'

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
