<script setup lang="ts">
import { mountTlDraw } from './children/tldrawRenderer.client'

definePageMeta({
  layout: 'wide',
})

const container = useTemplateRef('container')

let cleanup: (() => void) | null = null

onMounted(async () => {
  await nextTick()

  const element = container.value
  if (!element) {
    return
  }

  cleanup = mountTlDraw(element)
})

onUnmounted(() => {
  cleanup?.()
  cleanup = null
})
</script>

<template>
  <div ref="container" class="h-full w-full overflow-hidden rounded-lg border border-default bg-default" />
</template>
