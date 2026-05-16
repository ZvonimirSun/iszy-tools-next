<script setup lang="ts">
const mapContainer = useTemplateRef('mapContainer')

watchOnce(mapContainer, async (newVal) => {
  if (!newVal) {
    return
  }
  const { initMap } = await import('./children/init')
  initMap(newVal)
})
</script>

<template>
  <div
    ref="mapContainer"
    class="h-full w-full bg-black! z-0"
  />
</template>
