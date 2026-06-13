import type { OptionalExcept } from '@zvonimirsun/iszy-common'
import type { Favorite, Statistic, ToolMenu, ToolRecord } from '#shared/types/tool'

export const useToolsStore = defineStore('tools', () => {
  const favorite = ref<Favorite[]>([])
  const statistics = ref<Statistic[]>([])

  const toolItemsMap = computed<Record<string, ToolItem>>(() => {
    const map: Record<string, ToolItem> = {}
    useOriginToolsStore().toolItems.forEach((item: ToolItem) => {
      map[item.name] = item
    })
    return map
  })

  const toolMenus = computed<ToolMenu[]>(() => {
    const settings = useSettingsStore().general
    const oriToolMenus = useOriginToolsStore().toolMenus
    const oriToolItems = useOriginToolsStore().toolItems

    let tmp: ToolMenu[] = []
    if (settings.showType) {
      tmp = [...oriToolMenus]
    }
    else {
      tmp = [{
        label: '全部工具',
        children: oriToolItems,
      }]
    }

    return tmp.filter((item: ToolMenu) => {
      return item.children.length
    })
  })

  const toolMenusFilter = computed(() => {
    return (keyword: string): ToolMenu[] => {
      const keywords = normalizeSearchKeywords(keyword)
      return toolMenus.value.map((item: ToolMenu) => {
        return {
          ...item,
          children: filterToolsBySearchKeywords(item.children, keywords),
        }
      }).filter((item: ToolMenu) => {
        return item.children.length
      })
    }
  })

  const toolsFilter = computed(() => {
    return (tools: ToolItem[], keyword: string): ToolItem[] => {
      return filterToolsBySearchKeywords(tools, normalizeSearchKeywords(keyword))
    }
  })

  const isFav = computed(() => {
    return (label: string): boolean => {
      return favorite.value.filter(item => (item.label === label)).length > 0
    }
  })

  const recent = computed(() => {
    return (count?: number): Statistic[] => {
      return statistics.value.toSorted((a, b) => {
        return b.lastAccessTime - a.lastAccessTime
      }).slice(0, count)
    }
  })

  const most = computed(() => {
    return (count?: number): Statistic[] => {
      return statistics.value.toSorted((a, b) => {
        return b.times - a.times
      }).slice(0, count)
    }
  })

  function updateFav({ label, name, add }: OptionalExcept<Favorite, 'label'> & { add?: boolean } = { label: '' }) {
    if (add) {
      if (!name) {
        return
      }
      const tmp = favorite.value.find(item => (item.label === label))
      if (tmp) {
        tmp.name = name
      }
      else {
        favorite.value.push({ label, name })
      }
    }
    else {
      favorite.value = favorite.value.filter(item => (item.label !== label))
    }
  }

  function sortFavorite(ordered: Favorite[]) {
    const orderedLabels = new Set(ordered.map(item => item.label))
    let index = 0
    favorite.value = favorite.value.map((item) => {
      if (!orderedLabels.has(item.label)) {
        return item
      }
      return ordered[index++] || item
    })
  }

  function access({ label, name }: ToolRecord) {
    const tmp = statistics.value.find(item => (item.label === label))
    if (tmp) {
      tmp.times++
      tmp.lastAccessTime = Date.now()
      tmp.name = name
    }
    else {
      statistics.value.push({
        label,
        name,
        times: 1,
        lastAccessTime: Date.now(),
      })
    }
  }

  function clearHistory() {
    statistics.value = []
  }

  function fixFavorite() {
    const allTools = useOriginToolsStore().toolItems
    for (const tool of favorite.value) {
      const tmp = allTools.find(item => (item.label === tool.label))
      if (!tmp) {
        updateFav({ label: tool.label })
      }
      else if (tmp.name !== tool.name) {
        updateFav({ label: tool.label, name: tmp.name, add: true })
      }
    }
    for (const tool of statistics.value) {
      const tmp = allTools.find(item => (item.label === tool.label))
      if (!tmp) {
        statistics.value = statistics.value.filter(item => (item.label !== tool.label))
      }
      else if (tmp.name !== tool.name) {
        const statistic = statistics.value.find(item => (item.label === tool.label))
        if (statistic) {
          statistic.name = tmp.name
        }
      }
    }
  }

  return {
    favorite,
    statistics,
    toolItemsMap,
    toolMenus,
    toolMenusFilter,
    toolsFilter,
    isFav,
    recent,
    most,
    updateFav,
    sortFavorite,
    access,
    clearHistory,
    fixFavorite,
  }
}, {
  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useToolsStore, import.meta.hot))
}

function normalizeSearchKeywords(keyword: string) {
  return keyword
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
}

function filterToolsBySearchKeywords(tools: ToolItem[], keywords: string[]) {
  if (!keywords.length) {
    return tools
  }

  return tools.filter(tool => matchAllSearchKeywords(tool, keywords))
}

function matchAllSearchKeywords(tool: ToolItem, keywords: string[]) {
  const searchText = [
    tool.label,
    tool.name,
    tool.description,
    ...(tool.tags || []),
    ...(tool.aliases || []),
    ...(tool.keywords || []),
  ].filter(Boolean).join(' ').toLowerCase()

  return keywords.every(keyword => searchText.includes(keyword))
}
