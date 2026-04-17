<script setup lang="ts">
import type { OriginToolMenu } from '#shared/types/tool'

const input = useTemplateRef('input')

const searchStr = ref('')
const settingsStore = useSettingsStore()
const toolsStore = useToolsStore()

const toolMenus = computed(() => {
  return toolsStore.toolMenusFilter(searchStr.value)
})
const settings = settingsStore.general
// const isFav = toolsStore.isFav
// const updateFav = toolsStore.updateFav

const showUserToolMenus = ref(false)
const userToolMenus = computed<OriginToolMenu[]>(() => {
  if (!showUserToolMenus.value) {
    return []
  }
  const tmp: OriginToolMenu[] = []
  if (toolsStore.favorite.length) {
    tmp.push({
      label: '收藏',
      children: toolsStore.favorite,
    })
  }
  if (toolsStore.statistics.length) {
    if (settings.showMost) {
      tmp.push({
        label: '最常访问',
        children: toolsStore.most(6),
      })
    }
    if (settings.showRecent) {
      tmp.push({
        label: '最近访问',
        children: toolsStore.recent(6),
      })
    }
  }
  const keyword = searchStr.value.trim().toLowerCase()
  return tmp.map((item) => {
    return {
      ...item,
      children: item.children.filter((child) => {
        return child.label.toLowerCase().includes(keyword) || child.name.toLowerCase().includes(keyword)
      }),
    }
  }).filter((item) => {
    return item.children.length
  })
})

definePageMeta({
  layout: 'full',
})

defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus()
  },
})

onMounted(() => {
  toolsStore.fixFavorite()
  requestAnimationFrame(() => {
    showUserToolMenus.value = true
  })
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
      class="w-full"
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
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        >
          <div class="col-span-full text-muted">
            {{ item.label }}
          </div>
          <div
            v-for="(tool) in item.children"
            :key="tool.name"
          >
            <UPageCard
              class="bg-elevated border border-inverted hover:border-primary text-base font-semibold"
              :title="tool.label"
              :to="tool.name"
              :target="settings.openInNewTab || isExternalLink(tool.name) ? '_blank' : null"
            />
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
          <div
            v-for="(tool) in item.children"
            :key="tool.name"
          >
            <UPageCard
              class="bg-elevated border border-inverted hover:border-primary text-base font-semibold"
              :title="tool.label"
              :to="tool.name"
              :target="settings.openInNewTab || isExternalLink(tool.name) ? '_blank' : null"
            />
          </div>
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
