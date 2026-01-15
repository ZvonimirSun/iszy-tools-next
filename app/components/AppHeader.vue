<script setup lang="ts">
const { header } = useAppConfig()
const { public: { siteTitle } } = useRuntimeConfig()
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
          :to="header?.to || '/'"
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
