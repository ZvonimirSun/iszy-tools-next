<script lang="ts" setup>
import 'leaflet/dist/leaflet.css'

const keyword = ref('')
const mapContainer = useTemplateRef('mapContainer')

let handler: {
  keyword: globalThis.Ref<string, string>
  update: (val: string) => void
}

onMounted(async () => {
  if (!mapContainer.value) {
    return
  }
  const { useLatLngHandler } = await import('./children/useLatLngHandler')
  handler = useLatLngHandler(mapContainer.value, (val: string) => {
    keyword.value = val
  })
})

function update() {
  handler?.update(keyword.value)
}
</script>

<template>
  <div class="flex flex-col h-full w-full overflow-auto gap-2">
    <div class="w-full flex gap-2 items-center">
      <UInput
        v-model="keyword"
        class="flex-1"
        placeholder="输入经纬度(如'116.4,36.9')或地址(如'北京市政府')"
        allow-clear
        @keydown.enter="update"
      />
      <UButton
        color="primary"
        @click="update"
      >
        解析
      </UButton>
    </div>
    <div
      ref="mapContainer"
      class="flex-1 mapContainer"
    />
  </div>
</template>

<style scoped lang="scss">
.mapContainer {
  width: 100%;
  height: calc(100% - 2rem);

  :deep(.leaflet-popup-content) {
    p {
      margin: 0 0 .5rem 0;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
