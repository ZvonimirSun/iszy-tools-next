<script setup lang="ts">
import type { GeoJSON, Geometry } from '@zvonimirsun/map-sdk/2d'
import { createWktGeometrySource } from '../geoJson/children/file/geoJson.file'
import { isGeoJsonObject, isGeometry } from '../geoJson/children/geoJsonUtils'

type ConvertMode = 'wkt-to-geojson' | 'geojson-to-wkt'

const { copy } = useCopy()
const inputText = ref('')
const outputText = ref('')
const errorMessage = ref('')
const mode = ref<ConvertMode>('wkt-to-geojson')
const prettyGeoJson = ref(true)

const modeItems = [
  { label: 'WKT 转 GeoJSON', value: 'wkt-to-geojson' },
  { label: 'GeoJSON 转 WKT', value: 'geojson-to-wkt' },
]

const inputPlaceholder = computed(() => {
  return mode.value === 'wkt-to-geojson'
    ? '例如：POINT (116.397 39.908)'
    : `例如：${JSON.stringify({ type: 'Point', coordinates: [116.397, 39.908] }, null, 2)}`
})
const outputPlaceholder = computed(() => mode.value === 'wkt-to-geojson' ? '转换后的 GeoJSON' : '转换后的 WKT')

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function formatGeoJson(data: GeoJSON | Geometry) {
  return JSON.stringify(data, null, prettyGeoJson.value ? 2 : undefined)
}

async function convertWktToGeoJson() {
  const wellknown = await import('wellknown')
  const geometry = wellknown.parse(inputText.value.trim())

  if (!geometry || !isGeometry(geometry)) {
    throw new Error('输入内容不是有效的 WKT 几何')
  }

  outputText.value = formatGeoJson(geometry as Geometry)
}

async function convertGeoJsonToWkt() {
  let data: unknown
  try {
    data = JSON.parse(inputText.value)
  }
  catch {
    throw new Error('输入内容不是有效的 JSON')
  }

  if (!isGeoJsonObject(data)) {
    throw new Error('输入内容不是有效的 GeoJSON')
  }

  const geometry = createWktGeometrySource(data)
  const wellknown = await import('wellknown')
  const wkt = wellknown.stringify(geometry as never)

  if (!wkt) {
    throw new Error('WKT 转换失败')
  }

  outputText.value = wkt
}

async function convert() {
  errorMessage.value = ''
  outputText.value = ''

  if (!inputText.value.trim()) {
    errorMessage.value = '请输入需要转换的内容'
    return
  }

  try {
    if (mode.value === 'wkt-to-geojson') {
      await convertWktToGeoJson()
    }
    else {
      await convertGeoJsonToWkt()
    }
  }
  catch (error) {
    errorMessage.value = `转换失败，${getErrorMessage(error)}`
  }
}

function exchange() {
  const nextMode: ConvertMode = mode.value === 'wkt-to-geojson' ? 'geojson-to-wkt' : 'wkt-to-geojson'
  inputText.value = outputText.value
  outputText.value = ''
  errorMessage.value = ''
  mode.value = nextMode
}

function fillExample() {
  errorMessage.value = ''
  outputText.value = ''
  inputText.value = mode.value === 'wkt-to-geojson'
    ? 'POLYGON ((116.391 39.907, 116.402 39.907, 116.402 39.914, 116.391 39.914, 116.391 39.907))'
    : JSON.stringify({
        type: 'Feature',
        properties: {
          name: '示例点',
        },
        geometry: {
          type: 'Point',
          coordinates: [116.397, 39.908],
        },
      }, null, 2)
}
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-muted bg-muted/30 p-3">
      <div class="flex flex-wrap items-center gap-3">
        <USelect v-model="mode" class="w-48" :items="modeItems" />
        <USwitch v-model="prettyGeoJson" :disabled="mode !== 'wkt-to-geojson'" label="格式化 GeoJSON" />
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton icon="i-lucide:wand-sparkles" color="neutral" variant="soft" @click="fillExample">
          填入示例
        </UButton>
        <UButton icon="i-lucide:refresh-cw" color="neutral" variant="outline" :disabled="!outputText" @click="exchange">
          交换方向
        </UButton>
        <UButton color="primary" icon="i-lucide:arrow-right-left" @click="convert">
          开始转换
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      icon="i-lucide:circle-alert"
    />

    <div class="grid gap-4 xl:grid-cols-2">
      <section class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-medium text-highlighted">
            输入内容
          </h2>
          <span class="text-sm text-muted">{{ mode === 'wkt-to-geojson' ? 'WKT' : 'GeoJSON' }}</span>
        </div>
        <UTextarea
          v-model="inputText"
          class="w-full font-mono"
          :rows="14"
          resize
          :placeholder="inputPlaceholder"
        />
      </section>

      <section class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-medium text-highlighted">
            转换结果
          </h2>
          <UButton
            :disabled="!outputText"
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            size="sm"
            @click="copy(outputText)"
          >
            复制
          </UButton>
        </div>
        <UTextarea
          :model-value="outputText"
          class="w-full font-mono"
          :rows="14"
          resize
          readonly
          :placeholder="outputPlaceholder"
        />
      </section>
    </div>
  </div>
</template>
