<script setup lang="ts">
const { siteTitle } = usePublicConfig()
const route = useRoute()
const toolsStore = useToolsStore()

const tool = computed(() => {
  return toolsStore.toolItemsMap[route.path.slice(1)]
})
</script>

<template>
  <UHeader>
    <template #left>
      <div class="flex gap-1.5 items-center">
        <ULink
          to="/"
          class="font-bold text-xl text-highlighted"
        >
          {{ siteTitle }}
        </ULink>
        <template v-if="tool">
          <span>-</span>
          <span class="text-default">{{ tool.label }}</span>
        </template>
      </div>
    </template>
    <template #right>
      <ColorModeButtonExtend />
    </template>
  </UHeader>
</template>

<style scoped>

</style>
