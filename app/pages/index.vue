<script setup lang="ts">
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
      <ClientOnly>
        <template v-if="toolsStore.favorite.length">
          <div v-if="settings.showRecent" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div class="col-span-full text-muted">
              收藏
            </div>
            <div
              v-for="(tool) in toolsStore.favorite"
              :key="tool.name"
            >
              <UPageCard
                class="bg-elevated border text-base font-semibold"
                :title="tool.label"
                :to="tool.name"
                :target="settings.openInNewTab || isExternalLink(tool.name) ? '_blank' : null"
              />
            </div>
          </div>
        </template>
        <template v-if="toolsStore.statistics.length">
          <div v-if="settings.showRecent" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div class="col-span-full text-muted">
              最常访问
            </div>
            <div
              v-for="(tool) in toolsStore.most(6)"
              :key="tool.name"
            >
              <UPageCard
                class="bg-elevated border text-base font-semibold"
                :title="tool.label"
                :to="tool.name"
                :target="settings.openInNewTab || isExternalLink(tool.name) ? '_blank' : null"
              />
            </div>
          </div>
          <div v-if="settings.showRecent" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div class="col-span-full text-muted">
              最近访问
            </div>
            <div
              v-for="(tool) in toolsStore.recent(6)"
              :key="tool.name"
            >
              <UPageCard
                class="bg-elevated border text-base font-semibold"
                :title="tool.label"
                :to="tool.name"
                :target="settings.openInNewTab || isExternalLink(tool.name) ? '_blank' : null"
              />
            </div>
          </div>
        </template>
      </ClientOnly>
      <template
        v-for="(item, index) in toolMenus"
        :key="index"
      >
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div class="col-span-full text-muted">
            {{ item.label }}
          </div>
          <div
            v-for="(tool) in item.children"
            :key="tool.name"
          >
            <UPageCard
              class="bg-elevated border text-base font-semibold"
              :title="tool.label"
              :to="tool.name"
              :target="settings.openInNewTab || isExternalLink(tool.name) ? '_blank' : null"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>

</style>
