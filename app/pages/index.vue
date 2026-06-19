<script setup lang="ts">
import type { OriginToolItem, OriginToolMenu } from '#shared/types/tool'
import draggable from 'vuedraggable'

interface UserToolMenu extends OriginToolMenu {
  kind: 'favorite' | 'most' | 'recent'
}

const input = useTemplateRef('input')

const searchStr = ref('')
const settingsStore = useSettingsStore()
const toolsStore = useToolsStore()

const toolMenus = computed(() => {
  return toolsStore.toolMenusFilter(searchStr.value)
})
const settings = settingsStore.general
const isFav = toolsStore.isFav
function toggleFav(tool: OriginToolItem) {
  toolsStore.updateFav({
    label: tool.label,
    name: tool.name,
    add: !isFav(tool.label),
  })
}

const mounted = useMounted()

const showUserToolMenus = useState('showUserToolMenus', () => false)
const userToolMenus = computed<UserToolMenu[]>(() => {
  if (!showUserToolMenus.value) {
    return []
  }
  const tmp: UserToolMenu[] = []
  if (toolsStore.favorite.length) {
    tmp.push({
      kind: 'favorite',
      label: '收藏',
      children: toolsStore.favorite,
    })
  }
  if (toolsStore.statistics.length) {
    if (settings.showMost) {
      tmp.push({
        kind: 'most',
        label: '最常访问',
        children: toolsStore.most(6),
      })
    }
    if (settings.showRecent) {
      tmp.push({
        kind: 'recent',
        label: '最近访问',
        children: toolsStore.recent(6),
      })
    }
  }
  return tmp.map((item) => {
    return {
      ...item,
      children: toolsStore.toolsFilter(item.children, searchStr.value),
    }
  }).filter((item) => {
    return item.children.length
  })
})

const favoriteSortableItems = computed({
  get: () => toolsStore.favorite,
  set: (tools: OriginToolItem[]) => {
    toolsStore.sortFavorite(tools)
  },
})

const isSearching = computed(() => Boolean(searchStr.value.trim()))

defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus()
  },
})

onMounted(() => {
  toolsStore.fixFavorite()
  showUserToolMenus.value = true
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UInput
      v-if="settings.showSearch"
      ref="input"
      v-model="searchStr"
      size="xl"
      icon="i-icon-park-outline:search"
      placeholder="搜索工具..."
      class="w-full sticky top-[calc(var(--ui-header-height)+(--spacing(4)))] z-50 shadow-sm"
      :ui="{
        base: 'bg-default/75 backdrop-blur',
      }"
    >
      <template #trailing>
        <UKbd value="/" />
      </template>
    </UInput>
    <div class="w-full flex flex-col gap-4">
      <TransitionGroup name="list">
        <div
          v-for="(item, index) in userToolMenus"
          :key="`user${index}`"
          class="flex flex-col gap-4"
        >
          <div class="text-muted">
            {{ item.label }}
          </div>
          <draggable
            v-if="item.kind === 'favorite' && !isSearching"
            v-model="favoriteSortableItems"
            item-key="label"
            tag="div"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
            :force-fallback="true"
            :fallback-on-body="true"
            ghost-class="opacity-50"
            chosen-class="cursor-grabbing"
            drag-class="cursor-grabbing"
          >
            <template #item="{ element: tool }">
              <div>
                <UPageCard
                  class="group relative h-full bg-elevated border border-inverted hover:border-primary text-base cursor-move"
                  :to="tool.name"
                  :target="settings.openInNewTab || isExternalLink(tool.name) ? '_blank' : null"
                >
                  <template #title>
                    <span class="block pr-16">
                      {{ tool.label }}
                    </span>
                  </template>
                  <UTooltip v-if="mounted" text="拖拽排序">
                    <UButton
                      aria-label="拖拽排序"
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide:grip-vertical"
                      size="xs"
                      square
                      class="favorite-drag-handle absolute right-9 top-2 z-10 cursor-move opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      @click.stop.prevent
                    />
                  </UTooltip>
                  <UTooltip v-if="mounted" text="取消收藏">
                    <UButton
                      aria-label="取消收藏"
                      color="warning"
                      variant="soft"
                      icon="i-icon-park-solid:star"
                      size="xs"
                      square
                      class="absolute right-2 top-2 z-10 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      @click.stop.prevent="toggleFav(tool)"
                    />
                  </UTooltip>
                </UPageCard>
              </div>
            </template>
          </draggable>
          <div
            v-else-if="item.kind === 'favorite'"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          >
            <UPageCard
              v-for="tool in item.children"
              :key="tool.name"
              class="group relative bg-elevated border border-inverted hover:border-primary text-base"
              :to="tool.name"
              :target="settings.openInNewTab || isExternalLink(tool.name) ? '_blank' : null"
            >
              <template #title>
                <span class="block pr-8">
                  {{ tool.label }}
                </span>
              </template>
              <UTooltip v-if="mounted" text="取消收藏">
                <UButton
                  aria-label="取消收藏"
                  color="warning"
                  variant="soft"
                  icon="i-icon-park-solid:star"
                  size="xs"
                  square
                  class="absolute right-2 top-2 z-10 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  @click.stop.prevent="toggleFav(tool)"
                />
              </UTooltip>
            </UPageCard>
          </div>
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <UPageCard
              v-for="(tool) in item.children"
              :key="tool.name"
              class="group relative bg-elevated border border-inverted hover:border-primary text-base"
              :to="tool.name"
              :target="settings.openInNewTab || isExternalLink(tool.name) ? '_blank' : null"
            >
              <template #title>
                <span class="block pr-8">
                  {{ tool.label }}
                </span>
              </template>
              <UTooltip v-if="mounted" :text="isFav(tool.label) ? '取消收藏' : '收藏'">
                <UButton
                  :aria-label="isFav(tool.label) ? '取消收藏' : '收藏'"
                  :color="isFav(tool.label) ? 'warning' : 'neutral'"
                  :variant="isFav(tool.label) ? 'soft' : 'ghost'"
                  :icon="isFav(tool.label) ? 'i-icon-park-solid:star' : 'i-icon-park-outline:star'"
                  size="xs"
                  square
                  class="absolute right-2 top-2 z-10 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  @click.stop.prevent="toggleFav(tool)"
                />
              </UTooltip>
            </UPageCard>
          </div>
        </div>
        <div
          v-for="(item, index) in toolMenus"
          :key="index"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        >
          <div class="col-span-full text-muted">
            {{ item.label }}
          </div>
          <UPageCard
            v-for="(tool) in item.children"
            :key="tool.name"
            class="group relative bg-elevated border border-inverted hover:border-primary text-base"
            :to="tool.name"
            :target="settings.openInNewTab || isExternalLink(tool.name) ? '_blank' : null"
          >
            <template #title>
              <span class="block pr-8">
                {{ tool.label }}
              </span>
            </template>
            <UTooltip v-if="mounted" :text="isFav(tool.label) ? '取消收藏' : '收藏'">
              <UButton
                :aria-label="isFav(tool.label) ? '取消收藏' : '收藏'"
                :color="isFav(tool.label) ? 'warning' : 'neutral'"
                :variant="isFav(tool.label) ? 'soft' : 'ghost'"
                :icon="isFav(tool.label) ? 'i-icon-park-solid:star' : 'i-icon-park-outline:star'"
                size="xs"
                square
                class="absolute right-2 top-2 z-10 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                @click.stop.prevent="toggleFav(tool)"
              />
            </UTooltip>
          </UPageCard>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped lang="scss">
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
}
</style>
