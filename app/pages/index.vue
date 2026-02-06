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
  layout: 'home',
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
      icon="i-icon-park-outline-search"
      placeholder="搜索工具..."
      class="w-full"
    >
      <template #trailing>
        <UKbd value="/" />
      </template>
    </UInput>
    <div class="w-full flex flex-col gap-4">
      <template
        v-for="(item, index) in toolMenus"
        :key="index"
      >
        <div class="grid grid-cols-24 gap-4">
          <div class="col-span-24 text-muted">
            {{ item.label }}
          </div>
          <div
            v-for="(tool) in item.children"
            :key="tool.name"
            class="col-span-12 sm:col-span-8 md:col-span-6"
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
