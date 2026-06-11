<script setup lang="ts">
type CrsKind = 'wgs84' | 'gcj02' | 'bd09' | 'epsg' | 'proj4' | 'wkt'
type OutputFormat = 'list' | 'json' | 'csv'
type Coordinate = [number, number]

interface CrsConfig {
  kind: CrsKind
  epsgCode: string
  definition: string
}

interface CoordinateRow {
  index: number
  input: string
  source: Coordinate
  target: Coordinate
}

interface CrsUtilsModule {
  CrsUtils: {
    setCrs: (wkid: number | string, params: string) => void
    transformPoint: (from: number | string, to: number | string, position: Coordinate) => number[]
  }
}

const { copy } = useCopy()

const builtinEpsgCodes = new Set(['4326', '3857', '4490', '4610'])
const crsRegisterTasks = new Map<string, Promise<void>>()

const inputText = ref('')
const outputText = ref('')
const errorMessage = ref('')
const precision = ref(8)
const outputFormat = ref<OutputFormat>('list')
const sourceCrs = reactive<CrsConfig>({
  kind: 'wgs84',
  epsgCode: '4326',
  definition: '',
})
const targetCrs = reactive<CrsConfig>({
  kind: 'gcj02',
  epsgCode: '4490',
  definition: '',
})
const resultRows = ref<CoordinateRow[]>([])

const crsKindItems = [
  { label: 'WGS84 / EPSG:4326', value: 'wgs84' },
  { label: 'GCJ-02', value: 'gcj02' },
  { label: 'BD-09', value: 'bd09' },
  { label: 'EPSG Code', value: 'epsg' },
  { label: 'proj4 定义', value: 'proj4' },
  { label: 'WKT 定义', value: 'wkt' },
]

const outputFormatItems = [
  { label: '坐标列表', value: 'list' },
  { label: 'JSON', value: 'json' },
  { label: 'CSV', value: 'csv' },
]

const sourceLabel = computed(() => getCrsLabel(sourceCrs))
const targetLabel = computed(() => getCrsLabel(targetCrs))

const inputPlaceholder = [
  '每行一个坐标，支持逗号、空格或制表符分隔',
  '例如：',
  '116.397128,39.916527',
  '116.404 39.915',
].join('\n')

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function normalizeEpsgCode(code: string | undefined) {
  const value = code?.trim()
  return value && /^\d+$/.test(value) ? value : undefined
}

function getPrecisionValue() {
  const value = Number(precision.value)
  return Number.isFinite(value) ? Math.max(0, Math.min(12, value)) : 8
}

function roundCoordinate(value: number) {
  const rounded = Number(value.toFixed(getPrecisionValue()))
  return Object.is(rounded, -0) ? 0 : rounded
}

function getCrsLabel(config: CrsConfig) {
  if (config.kind === 'wgs84') {
    return 'WGS84 / EPSG:4326'
  }

  if (config.kind === 'gcj02') {
    return 'GCJ-02'
  }

  if (config.kind === 'bd09') {
    return 'BD-09'
  }

  if (config.kind === 'epsg') {
    return `EPSG:${normalizeEpsgCode(config.epsgCode) ?? '未填写'}`
  }

  return config.kind === 'proj4' ? '自定义 proj4' : '自定义 WKT'
}

function parseCoordinates() {
  const rows = inputText.value
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), index: index + 1 }))
    .filter(item => item.line)

  if (!rows.length) {
    throw new Error('请输入需要转换的坐标')
  }

  return rows.map(({ line, index }) => {
    const values = line
      .replace(/[，,;\t]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean)

    if (values.length < 2) {
      throw new TypeError(`第 ${index} 行坐标格式不正确`)
    }

    const x = Number(values[0])
    const y = Number(values[1])
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new TypeError(`第 ${index} 行包含无效数字`)
    }

    return {
      index,
      input: line,
      source: [x, y] as Coordinate,
    }
  })
}

async function loadCrsUtils() {
  return await import('@zvonimirsun/map-sdk/2d') as CrsUtilsModule
}

async function ensureEpsgCrsRegistered(code: string) {
  if (builtinEpsgCodes.has(code)) {
    return
  }

  let task = crsRegisterTasks.get(code)
  if (!task) {
    task = registerEpsgCrs(code)
    crsRegisterTasks.set(code, task)
  }

  await task
}

async function registerEpsgCrs(code: string) {
  const def = await $fetch<string>(`/api/epsg/${code}.proj4`, {
    responseType: 'text',
  })
  const { CrsUtils } = await loadCrsUtils()
  CrsUtils.setCrs(Number(code), def)
}

async function resolveCrs(config: CrsConfig, role: 'source' | 'target') {
  if (config.kind === 'wgs84') {
    return '4326'
  }

  if (config.kind === 'gcj02') {
    return 'gcj02'
  }

  if (config.kind === 'bd09') {
    return 'bd09'
  }

  if (config.kind === 'epsg') {
    const code = normalizeEpsgCode(config.epsgCode)
    if (!code) {
      throw new Error(`${role === 'source' ? '源' : '目标'}坐标系 EPSG Code 不能为空`)
    }

    await ensureEpsgCrsRegistered(code)
    return code
  }

  const definition = config.definition.trim()
  if (!definition) {
    throw new Error(`${role === 'source' ? '源' : '目标'}坐标系定义不能为空`)
  }

  const id = `custom-${role}`
  const { CrsUtils } = await loadCrsUtils()
  CrsUtils.setCrs(id, definition)
  return id
}

function formatCoordinate(coordinate: Coordinate) {
  return coordinate.map(roundCoordinate) as Coordinate
}

function formatRows(rows: CoordinateRow[]) {
  if (outputFormat.value === 'json') {
    return JSON.stringify(rows.map(row => ({
      index: row.index,
      input: row.input,
      source: row.source,
      target: row.target,
    })), null, 2)
  }

  if (outputFormat.value === 'csv') {
    return [
      'index,input_x,input_y,output_x,output_y',
      ...rows.map(row => [
        row.index,
        row.source[0],
        row.source[1],
        row.target[0],
        row.target[1],
      ].join(',')),
    ].join('\n')
  }

  return rows.map(row => `${row.target[0]},${row.target[1]}`).join('\n')
}

async function transformCoordinates() {
  errorMessage.value = ''
  outputText.value = ''
  resultRows.value = []

  try {
    const rows = parseCoordinates()
    const [sourceId, targetId] = await Promise.all([
      resolveCrs(sourceCrs, 'source'),
      resolveCrs(targetCrs, 'target'),
    ])
    const { CrsUtils } = await loadCrsUtils()

    resultRows.value = rows.map((row) => {
      const target = CrsUtils.transformPoint(sourceId, targetId, row.source)
      const nextTarget = formatCoordinate([target[0]!, target[1]!])
      if (!Number.isFinite(nextTarget[0]) || !Number.isFinite(nextTarget[1])) {
        throw new TypeError(`第 ${row.index} 行转换结果无效`)
      }

      return {
        ...row,
        source: formatCoordinate(row.source),
        target: nextTarget,
      }
    })
    outputText.value = formatRows(resultRows.value)
  }
  catch (error) {
    errorMessage.value = `转换失败，${getErrorMessage(error)}`
  }
}

function exchangeCrs() {
  const nextSource = { ...targetCrs }
  const nextTarget = { ...sourceCrs }
  Object.assign(sourceCrs, nextSource)
  Object.assign(targetCrs, nextTarget)

  if (outputText.value) {
    inputText.value = outputText.value
    outputText.value = ''
    resultRows.value = []
  }
  errorMessage.value = ''
}

function fillExample() {
  errorMessage.value = ''
  outputText.value = ''
  resultRows.value = []
  sourceCrs.kind = 'wgs84'
  targetCrs.kind = 'gcj02'
  inputText.value = [
    '116.397128,39.916527',
    '121.473701 31.230416',
    '113.264385,23.129112',
  ].join('\n')
}
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <div class="grid gap-4 xl:grid-cols-2">
      <section class="flex min-w-0 flex-col gap-3 rounded-lg border border-muted bg-muted/30 p-3">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-medium text-highlighted">
            源坐标系
          </h2>
          <span class="text-sm text-muted">{{ sourceLabel }}</span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <USelect v-model="sourceCrs.kind" class="w-48" :items="crsKindItems" />
          <UInput
            v-if="sourceCrs.kind === 'epsg'"
            v-model="sourceCrs.epsgCode"
            class="w-40"
            placeholder="例如 3857"
          >
            <template #leading>
              <span class="text-xs text-muted">EPSG</span>
            </template>
          </UInput>
        </div>
        <UTextarea
          v-if="sourceCrs.kind === 'proj4' || sourceCrs.kind === 'wkt'"
          v-model="sourceCrs.definition"
          class="w-full font-mono"
          :rows="5"
          :placeholder="sourceCrs.kind === 'proj4' ? '+proj=longlat +datum=WGS84 +no_defs +type=crs' : '粘贴坐标系 WKT 定义'"
        />
      </section>

      <section class="flex min-w-0 flex-col gap-3 rounded-lg border border-muted bg-muted/30 p-3">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-medium text-highlighted">
            目标坐标系
          </h2>
          <span class="text-sm text-muted">{{ targetLabel }}</span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <USelect v-model="targetCrs.kind" class="w-48" :items="crsKindItems" />
          <UInput
            v-if="targetCrs.kind === 'epsg'"
            v-model="targetCrs.epsgCode"
            class="w-40"
            placeholder="例如 4490"
          >
            <template #leading>
              <span class="text-xs text-muted">EPSG</span>
            </template>
          </UInput>
        </div>
        <UTextarea
          v-if="targetCrs.kind === 'proj4' || targetCrs.kind === 'wkt'"
          v-model="targetCrs.definition"
          class="w-full font-mono"
          :rows="5"
          :placeholder="targetCrs.kind === 'proj4' ? '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs' : '粘贴坐标系 WKT 定义'"
        />
      </section>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-muted bg-muted/30 p-3">
      <div class="flex flex-wrap items-center gap-3">
        <USelect v-model="outputFormat" class="w-36" :items="outputFormatItems" />
        <UInput v-model.number="precision" class="w-28" type="number" :min="0" :max="12">
          <template #trailing>
            <span class="text-xs text-muted">位</span>
          </template>
        </UInput>
        <span v-if="resultRows.length" class="text-sm text-muted">已转换 {{ resultRows.length }} 个坐标</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton icon="i-lucide:wand-sparkles" color="neutral" variant="soft" @click="fillExample">
          填入示例
        </UButton>
        <UButton icon="i-lucide:refresh-cw" color="neutral" variant="outline" @click="exchangeCrs">
          交换方向
        </UButton>
        <UButton color="primary" icon="i-lucide:arrow-right-left" @click="transformCoordinates">
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
            输入坐标
          </h2>
          <span class="text-sm text-muted">{{ sourceLabel }}</span>
        </div>
        <UTextarea
          v-model="inputText"
          class="w-full font-mono"
          :rows="14"
          :placeholder="inputPlaceholder"
        />
      </section>

      <section class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-medium text-highlighted">
            转换结果
          </h2>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted">{{ targetLabel }}</span>
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
          readonly
          placeholder="转换后的坐标"
        />
      </section>
    </div>
  </div>
</template>
