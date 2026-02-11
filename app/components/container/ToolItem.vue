<script setup lang="ts">
defineProps<{
  label?: string
  contentClass?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-2 overflow-auto">
    <span v-if="label">{{ label }}</span>
    <div class="bg-elevated/50 rounded-lg p-6 shadow border border-muted w-full" :class="contentClass">
      <slot />
    </div>
  </div>
</template>
