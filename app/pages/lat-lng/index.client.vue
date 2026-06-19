<script lang="ts" setup>
import 'leaflet/dist/leaflet.css'

definePageMeta({ layout: 'bounded' })

const keyword = ref('')
const epsgCode = ref('4326')
const epsgCodeInput = ref('4326')
const epsgInputVersion = ref(0)
const mapContainer = useTemplateRef('mapContainer')

let handler: {
  keyword: globalThis.Ref<string, string>
  update: (val: string) => Promise<void>
}

onMounted(async () => {
  await nextTick()

  if (!mapContainer.value) {
    return
  }
  const { useLatLngHandler } = await import('./children/useLatLngHandler')
  handler = useLatLngHandler(mapContainer.value, (val: string) => {
    keyword.value = val
  }, epsgCode, epsgInputVersion)
})

async function update() {
  await handler?.update(keyword.value)
}

function cancelPendingEpsgRender() {
  epsgInputVersion.value += 1
}

function commitEpsgCode() {
  const nextCode = epsgCodeInput.value.trim() || '4326'
  epsgCodeInput.value = nextCode
  if (nextCode === epsgCode.value) {
    return
  }

  epsgInputVersion.value += 1
  epsgCode.value = nextCode
}
</script>

<template>
  <div class="flex flex-col h-full w-full overflow-auto gap-2">
    <div class="grid w-full grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
      <UFormField label="坐标或地址">
        <UInput
          v-model="keyword"
          class="w-full"
          placeholder="输入经纬度(如'116.4,36.9')或地址(如'北京市政府')"
          allow-clear
          @keydown.enter="update"
        />
      </UFormField>
      <UFormField label="展示 EPSG">
        <UInput
          v-model="epsgCodeInput"
          class="w-full"
          placeholder="4326"
          @change="commitEpsgCode"
          @keydown.enter.prevent="commitEpsgCode"
          @update:model-value="cancelPendingEpsgRender"
        />
      </UFormField>
      <UButton
        color="primary"
        class="sm:mb-0"
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
