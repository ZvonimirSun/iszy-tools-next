<script setup lang="ts">
const mapContainer = useTemplateRef('mapContainer')

onMounted(async () => {
  if (!mapContainer.value) {
    return
  }
  const { initMap } = await import('./children/init')
  initMap(mapContainer.value)
})
</script>

<template>
  <div
    ref="mapContainer"
    class="h-full w-full bg-black! z-0"
  />
</template>
