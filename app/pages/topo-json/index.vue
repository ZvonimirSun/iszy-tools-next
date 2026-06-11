<script setup lang="ts">
import type { GeoJSON } from '@zvonimirsun/map-sdk/2d'
import { createDirectGeoJsonSource, mergeGeoJsonList, normalizeImportedGeoJson } from '../geo-json/children/file/geoJson.file'
import { getGeoJsonCrs, withTopLevelGeoJsonCrs } from '../geo-json/children/geoJsonUtils'

type ConvertMode = 'geojson-to-topojson' | 'topojson-to-geojson'

const { copy } = useCopy()
const inputText = ref('')
const outputText = ref('')
const errorMessage = ref('')
const mode = ref<ConvertMode>('geojson-to-topojson')
const prettyJson = ref(true)

const modeItems = [
  { label: 'GeoJSON 转 TopoJSON', value: 'geojson-to-topojson' },
  { label: 'TopoJSON 转 GeoJSON', value: 'topojson-to-geojson' },
]

const inputTypeLabel = computed(() => mode.value === 'geojson-to-topojson' ? 'GeoJSON' : 'TopoJSON')
const outputTypeLabel = computed(() => mode.value === 'geojson-to-topojson' ? 'TopoJSON' : 'GeoJSON')
const inputPlaceholder = computed(() => {
  return mode.value === 'geojson-to-topojson'
    ? `例如：${JSON.stringify(createExampleGeoJson(), null, 2)}`
    : '请输入 TopoJSON，例如包含 type、objects、arcs 的拓扑对象'
})
const outputPlaceholder = computed(() => `转换后的 ${outputTypeLabel.value}`)

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function formatJson(data: unknown) {
  return JSON.stringify(data, null, prettyJson.value ? 2 : undefined)
}

function parseJsonInput() {
  try {
    return JSON.parse(inputText.value)
  }
  catch {
    throw new Error('输入内容不是有效的 JSON')
  }
}

function createExampleGeoJson(): GeoJSON {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: '示例区域',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [116.391, 39.907],
              [116.402, 39.907],
              [116.402, 39.914],
              [116.391, 39.914],
              [116.391, 39.907],
            ],
          ],
        },
      },
    ],
  }
}

function assertTopoJson(data: unknown): asserts data is { objects: Record<string, unknown> } {
  if (!data || typeof data !== 'object' || !('objects' in data) || typeof (data as { objects?: unknown }).objects !== 'object') {
    throw new Error('输入内容不是有效的 TopoJSON')
  }
}

async function convertGeoJsonToTopoJson() {
  const { topology } = await import('topojson-server')
  const geoJson = createDirectGeoJsonSource(parseJsonInput())
  const crs = getGeoJsonCrs(geoJson)
  const output = topology({ data: geoJson as never }) as unknown as Record<string, unknown>
  if (crs) {
    output.crs = crs
  }
  outputText.value = formatJson(output)
}

async function convertTopoJsonToGeoJson() {
  const { feature } = await import('topojson-client')
  const topology = parseJsonInput()
  assertTopoJson(topology)

  const geoJsonList = Object.keys(topology.objects).map((key) => {
    return feature(topology as never, key) as unknown
  })
  const output = normalizeImportedGeoJson(withTopLevelGeoJsonCrs(mergeGeoJsonList(geoJsonList), getGeoJsonCrs(topology)))
  outputText.value = formatJson(output)
}

async function convert() {
  errorMessage.value = ''
  outputText.value = ''

  if (!inputText.value.trim()) {
    errorMessage.value = '请输入需要转换的内容'
    return
  }

  try {
    if (mode.value === 'geojson-to-topojson') {
      await convertGeoJsonToTopoJson()
    }
    else {
      await convertTopoJsonToGeoJson()
    }
  }
  catch (error) {
    errorMessage.value = `转换失败，${getErrorMessage(error)}`
  }
}

function exchange() {
  const nextMode: ConvertMode = mode.value === 'geojson-to-topojson' ? 'topojson-to-geojson' : 'geojson-to-topojson'
  inputText.value = outputText.value
  outputText.value = ''
  errorMessage.value = ''
  mode.value = nextMode
}

function fillExample() {
  errorMessage.value = ''
  outputText.value = ''
  inputText.value = mode.value === 'geojson-to-topojson'
    ? formatJson(createExampleGeoJson())
    : JSON.stringify({
        type: 'Topology',
        objects: {
          point: {
            type: 'Point',
            coordinates: [116.397, 39.908],
          },
        },
        arcs: [],
      }, null, prettyJson.value ? 2 : undefined)
}
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-muted bg-muted/30 p-3">
      <div class="flex flex-wrap items-center gap-3">
        <USelect v-model="mode" class="w-52" :items="modeItems" />
        <USwitch v-model="prettyJson" label="格式化 JSON" />
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
          <span class="text-sm text-muted">{{ inputTypeLabel }}</span>
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
