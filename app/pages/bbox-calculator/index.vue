<script setup lang="ts">
import type { Feature, FeatureCollection, GeoJSON, Geometry } from '@zvonimirsun/map-sdk/2d'
import { mergeGeoJsonList, normalizeImportedGeoJson } from '../geo-json/children/file/geoJson.file'
import { getGeoJsonCrs, isGeoJsonObject, isGeometry, withTopLevelGeoJsonCrs } from '../geo-json/children/geoJsonUtils'

type InputFormat = 'auto' | 'geojson' | 'wkt' | 'topojson' | 'geojsonl'
type BBox = [number, number, number, number]

interface BBoxResult {
  detectedFormat: string
  bbox: BBox
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
  center: [number, number]
  bboxPolygonGeoJson: GeoJSON
  bboxPolygonWkt: string
}

const { copy } = useCopy()
const inputText = ref('')
const outputText = ref('')
const errorMessage = ref('')
const inputFormat = ref<InputFormat>('auto')
const prettyJson = ref(true)
const precision = ref(6)
const result = ref<BBoxResult>()

const formatItems = [
  { label: '自动识别', value: 'auto' },
  { label: 'GeoJSON', value: 'geojson' },
  { label: 'WKT', value: 'wkt' },
  { label: 'TopoJSON', value: 'topojson' },
  { label: 'GeoJSONL', value: 'geojsonl' },
]

const resultRows = computed(() => {
  if (!result.value) {
    return []
  }

  return [
    { label: 'minX', value: result.value.minX },
    { label: 'minY', value: result.value.minY },
    { label: 'maxX', value: result.value.maxX },
    { label: 'maxY', value: result.value.maxY },
    { label: 'width', value: result.value.width },
    { label: 'height', value: result.value.height },
    { label: 'center', value: result.value.center.join(', ') },
  ]
})

const inputPlaceholder = computed(() => {
  if (inputFormat.value === 'wkt') {
    return '例如：POLYGON ((116.391 39.907, 116.402 39.907, 116.402 39.914, 116.391 39.914, 116.391 39.907))'
  }

  if (inputFormat.value === 'topojson') {
    return '请输入 TopoJSON，例如包含 type、objects、arcs 的拓扑对象'
  }

  if (inputFormat.value === 'geojsonl') {
    return '每行一个 GeoJSON Feature 或 Geometry'
  }

  return `例如：${JSON.stringify(createExampleGeoJson(), null, 2)}`
})

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function getPrecisionValue() {
  const value = Number(precision.value)
  return Number.isFinite(value) ? Math.max(0, Math.min(12, value)) : 6
}

function roundCoordinate(value: number) {
  const rounded = Number(value.toFixed(getPrecisionValue()))
  return Object.is(rounded, -0) ? 0 : rounded
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
          name: '示例范围',
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

function parseGeoJsonText() {
  const data = parseJsonInput()
  if (!isGeoJsonObject(data)) {
    throw new Error('输入内容不是有效的 GeoJSON')
  }

  return normalizeImportedGeoJson(data)
}

function parseGeoJsonLinesText() {
  const items = inputText.value
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      let data: unknown
      try {
        data = JSON.parse(line)
      }
      catch {
        throw new Error(`第 ${index + 1} 行不是有效的 JSON`)
      }

      if (!isGeoJsonObject(data)) {
        throw new Error(`第 ${index + 1} 行不是有效的 GeoJSON`)
      }

      return data
    })

  if (!items.length) {
    throw new Error('请输入 GeoJSONL 内容')
  }

  return normalizeImportedGeoJson(mergeGeoJsonList(items))
}

async function parseWktText() {
  const wellknown = await import('wellknown')
  const geometry = wellknown.parse(inputText.value.trim())

  if (!geometry || !isGeometry(geometry)) {
    throw new Error('输入内容不是有效的 WKT 几何')
  }

  return geometry as Geometry
}

async function parseTopoJsonText() {
  const { feature } = await import('topojson-client')
  const topology = parseJsonInput()
  assertTopoJson(topology)

  const geoJsonList = Object.keys(topology.objects).map((key) => {
    return feature(topology as never, key) as unknown
  })

  return normalizeImportedGeoJson(withTopLevelGeoJsonCrs(mergeGeoJsonList(geoJsonList), getGeoJsonCrs(topology)))
}

async function parseInput() {
  if (inputFormat.value === 'geojson') {
    return { data: parseGeoJsonText(), detectedFormat: 'GeoJSON' }
  }

  if (inputFormat.value === 'wkt') {
    return { data: await parseWktText(), detectedFormat: 'WKT' }
  }

  if (inputFormat.value === 'topojson') {
    return { data: await parseTopoJsonText(), detectedFormat: 'TopoJSON' }
  }

  if (inputFormat.value === 'geojsonl') {
    return { data: parseGeoJsonLinesText(), detectedFormat: 'GeoJSONL' }
  }

  const trimmed = inputText.value.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const data = parseJsonInput()
    if (data && typeof data === 'object' && !Array.isArray(data) && 'objects' in data) {
      return { data: await parseTopoJsonText(), detectedFormat: 'TopoJSON' }
    }

    if (isGeoJsonObject(data)) {
      return { data: normalizeImportedGeoJson(data), detectedFormat: 'GeoJSON' }
    }
  }

  if (trimmed.includes('\n')) {
    try {
      return { data: parseGeoJsonLinesText(), detectedFormat: 'GeoJSONL' }
    }
    catch {
      // Continue trying WKT so automatic recognition can handle multiline WKT.
    }
  }

  return { data: await parseWktText(), detectedFormat: 'WKT' }
}

function collectGeoJsonBBox(data: GeoJSON, bbox: BBox) {
  if (isGeometry(data)) {
    collectGeometryBBox(data, bbox)
    return
  }

  if (data.type === 'Feature') {
    collectGeometryBBox((data as Feature).geometry, bbox)
    return
  }

  if (data.type === 'FeatureCollection') {
    for (const feature of (data as FeatureCollection).features) {
      collectGeometryBBox(feature.geometry, bbox)
    }
  }
}

function collectGeometryBBox(geometry: Geometry | null | undefined, bbox: BBox) {
  if (!geometry) {
    return
  }

  if (geometry.type === 'GeometryCollection') {
    for (const item of geometry.geometries) {
      collectGeometryBBox(item, bbox)
    }
    return
  }

  collectCoordinatesBBox((geometry as { coordinates?: unknown }).coordinates, bbox)
}

function collectCoordinatesBBox(value: unknown, bbox: BBox) {
  if (!Array.isArray(value)) {
    return
  }

  if (typeof value[0] === 'number' && typeof value[1] === 'number' && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
    bbox[0] = Math.min(bbox[0], value[0])
    bbox[1] = Math.min(bbox[1], value[1])
    bbox[2] = Math.max(bbox[2], value[0])
    bbox[3] = Math.max(bbox[3], value[1])
    return
  }

  for (const item of value) {
    collectCoordinatesBBox(item, bbox)
  }
}

function createBboxPolygonGeoJson(bbox: BBox): GeoJSON {
  const [minX, minY, maxX, maxY] = bbox
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [minX, minY],
          [maxX, minY],
          [maxX, maxY],
          [minX, maxY],
          [minX, minY],
        ],
      ],
    },
  }
}

function createBboxPolygonWkt(bbox: BBox) {
  const [minX, minY, maxX, maxY] = bbox
  return `POLYGON ((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`
}

function createResult(data: GeoJSON, detectedFormat: string): BBoxResult {
  const rawBBox: BBox = [Infinity, Infinity, -Infinity, -Infinity]
  collectGeoJsonBBox(data, rawBBox)

  if (!Number.isFinite(rawBBox[0])) {
    throw new TypeError('未找到有效坐标')
  }

  const bbox = rawBBox.map(roundCoordinate) as BBox
  const [minX, minY, maxX, maxY] = bbox
  const center: [number, number] = [
    roundCoordinate((rawBBox[0] + rawBBox[2]) / 2),
    roundCoordinate((rawBBox[1] + rawBBox[3]) / 2),
  ]

  return {
    detectedFormat,
    bbox,
    minX,
    minY,
    maxX,
    maxY,
    width: roundCoordinate(rawBBox[2] - rawBBox[0]),
    height: roundCoordinate(rawBBox[3] - rawBBox[1]),
    center,
    bboxPolygonGeoJson: createBboxPolygonGeoJson(bbox),
    bboxPolygonWkt: createBboxPolygonWkt(bbox),
  }
}

async function calculate() {
  errorMessage.value = ''
  outputText.value = ''
  result.value = undefined

  if (!inputText.value.trim()) {
    errorMessage.value = '请输入需要计算的空间数据'
    return
  }

  try {
    const parsed = await parseInput()
    const nextResult = createResult(parsed.data, parsed.detectedFormat)
    result.value = nextResult
    outputText.value = formatJson(nextResult)
  }
  catch (error) {
    errorMessage.value = `计算失败，${getErrorMessage(error)}`
  }
}

function fillExample() {
  errorMessage.value = ''
  outputText.value = ''
  result.value = undefined

  if (inputFormat.value === 'wkt') {
    inputText.value = 'POLYGON ((116.391 39.907, 116.402 39.907, 116.402 39.914, 116.391 39.914, 116.391 39.907))'
    return
  }

  if (inputFormat.value === 'topojson') {
    inputText.value = JSON.stringify({
      type: 'Topology',
      objects: {
        area: {
          type: 'Polygon',
          arcs: [[0]],
        },
      },
      arcs: [
        [[116.391, 39.907], [0.011, 0], [0, 0.007], [-0.011, 0], [0, -0.007]],
      ],
    }, null, prettyJson.value ? 2 : undefined)
    return
  }

  if (inputFormat.value === 'geojsonl') {
    inputText.value = [
      JSON.stringify({ type: 'Feature', properties: { name: 'A' }, geometry: { type: 'Point', coordinates: [116.391, 39.907] } }),
      JSON.stringify({ type: 'Feature', properties: { name: 'B' }, geometry: { type: 'Point', coordinates: [116.402, 39.914] } }),
    ].join('\n')
    return
  }

  inputText.value = formatJson(createExampleGeoJson())
}
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-muted bg-muted/30 p-3">
      <div class="flex flex-wrap items-center gap-3">
        <USelect v-model="inputFormat" class="w-36" :items="formatItems" />
        <UInput v-model.number="precision" class="w-28" type="number" :min="0" :max="12">
          <template #trailing>
            <span class="text-xs text-muted">位</span>
          </template>
        </UInput>
        <USwitch v-model="prettyJson" label="格式化 JSON" />
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton icon="i-lucide:wand-sparkles" color="neutral" variant="soft" @click="fillExample">
          填入示例
        </UButton>
        <UButton color="primary" icon="i-lucide:box-select" @click="calculate">
          计算 BBox
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

    <div v-if="result" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="item in resultRows"
        :key="item.label"
        class="rounded-lg border border-muted bg-muted/20 p-3"
      >
        <div class="text-xs text-muted">
          {{ item.label }}
        </div>
        <div class="break-all font-mono text-sm text-highlighted">
          {{ item.value }}
        </div>
      </div>
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <section class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-medium text-highlighted">
            输入内容
          </h2>
          <span class="text-sm text-muted">{{ inputFormat === 'auto' ? 'GeoJSON / WKT / TopoJSON / GeoJSONL' : inputFormat }}</span>
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
            计算结果
          </h2>
          <div class="flex items-center gap-2">
            <span v-if="result" class="text-sm text-muted">{{ result.detectedFormat }}</span>
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
        </div>
        <UTextarea
          :model-value="outputText"
          class="w-full font-mono"
          :rows="14"
          resize
          readonly
          placeholder="计算后的 bbox、中心点、尺寸和 bbox 面"
        />
      </section>
    </div>
  </div>
</template>
