<script setup lang="ts">
const input = useTemplateRef('input')

const searchStr = ref('')
const settingsStore = useSettingsStore()
const toolsStore = useToolsStore()

const toolMenus = computed(() => {
  return toolsStore.toolMenusFilter(searchStr.value)
})
const settings = settingsStore.general
const isFav = toolsStore.isFav
const updateFav = toolsStore.updateFav

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
    <div class="overflow-y-auto w-full" />
  </div>
</template>

<style scoped>

</style>
