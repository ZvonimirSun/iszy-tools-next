<script setup lang="ts">
const input = useTemplateRef('input')

definePageMeta({
  layout: 'home',
})

defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus()
  },
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UInput
      ref="input"
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
