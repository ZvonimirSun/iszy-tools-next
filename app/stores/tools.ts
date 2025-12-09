import type { Favorite, Statistic, ToolMenu } from '#shared/types/tool'
import type { OptionalExcept } from '@zvonimirsun/iszy-common'

export const useToolsStore = defineStore('toolsStore', {
  state: () => ({
    favorite: [] as Favorite[],
    statistics: [] as Statistic[],
  }),
  getters: {
    toolMenus(): ToolMenu[] {
      const settings = useSettingsStore().general
      const oriToolMenus = useOriginToolsStore().toolMenus
      const oriToolItems = useOriginToolsStore().toolItems
      const count = 6

      let tmp: ToolMenu[] = []
      if (settings.showType) {
        tmp = [...oriToolMenus]
      }
      else {
        tmp = [{
          label: '工具',
          icon: 'i-icon-park-solid-all-application',
          children: oriToolItems,
        }]
      }

      if (settings.showMost && this.most().length > 0) {
        tmp.unshift({
          label: '最常访问',
          icon: 'i-icon-park-solid-concern',
          children: this.most(count),
        })
      }
      if (this.favorite.length > 0) {
        tmp.unshift({
          label: '收藏',
          icon: 'i-icon-park-solid-folder-focus',
          children: this.favorite,
        })
      }
      return tmp.filter((item: ToolMenu) => {
        return item.children.length
      })
    },
    toolMenusFilter(): (keyword: string) => ToolMenu[] {
      return (keyword: string): ToolMenu[] => {
        const tmp = keyword.trim().toLowerCase()
        return this.toolMenus.map((item: ToolMenu) => {
          return {
            ...item,
            children: item.children.filter((child: ToolItem) => {
              return child.label.toLowerCase().includes(tmp) || child.name.toLowerCase().includes(tmp) || (child.tags || []).some(tag => tag.toLowerCase().includes(tmp))
            }),
          }
        }).filter((item: ToolMenu) => {
          return item.children.length
        })
      }
    },

    isFav: state => (label: string): boolean => {
      return state.favorite.filter(item => (item.label === label)).length > 0
    },
    recent: state => (count?: number): Statistic[] => {
      return [...state.statistics].sort((a, b) => {
        return b.lastAccessTime - a.lastAccessTime
      }).slice(0, count)
    },
    most: state => (count?: number): Statistic[] => {
      return [...state.statistics].sort((a, b) => {
        return b.times - a.times
      }).slice(0, count)
    },
  },
  actions: {
    // 收藏相关
    updateFav({ label, name, add }: OptionalExcept<Favorite, 'label'> & { add?: boolean } = { label: '' }) {
      if (add) {
        if (!name) {
          return
        }
        const tmp = this.favorite.find(item => (item.label === label))
        if (tmp) {
          tmp.name = name
        }
        else {
          this.favorite.push({ label, name })
        }
      }
      else {
        this.favorite = this.favorite.filter(item => (item.label !== label))
      }
    },
    access({ label, name }: Favorite) {
      const tmp = this.statistics.find(item => (item.label === label))
      if (tmp) {
        tmp.times++
        tmp.lastAccessTime = new Date().getTime()
        tmp.name = name
      }
      else {
        this.statistics.push({
          label,
          name,
          times: 1,
          lastAccessTime: new Date().getTime(),
        })
      }
    },

    clearHistory() {
      this.statistics = []
    },

    fixFavorite() {
      const allTools = useOriginToolsStore().toolItems
      for (const tool of this.favorite) {
        const tmp = allTools.find(item => (item.label === tool.label))
        if (!tmp) {
          this.updateFav({ label: tool.label })
        }
        else if (tmp.name !== tool.name) {
          this.updateFav({ label: tool.label, name: tmp.name, add: true })
        }
      }
      for (const tool of this.statistics) {
        const tmp = allTools.find(item => (item.label === tool.label))
        if (!tmp) {
          this.statistics = this.statistics.filter(item => (item.label !== tool.label))
        }
        else if (tmp.name !== tool.name) {
          const tmp = this.statistics.find(item => (item.label === tool.label))
          if (tmp) {
            tmp.name = tool.name
          }
        }
      }
    },
  },
})
