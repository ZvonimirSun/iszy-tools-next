<script setup lang="ts">
type CrsKind = 'epsg' | 'custom' | 'gcj02' | 'bd09'
type Coordinate = [number, number]

interface CrsConfig {
  kind: CrsKind
  epsgCode: string
  definition: string
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

const outputText = ref('')
const errorMessage = ref('')
const precision = ref(8)
const sourceX = ref('')
const sourceY = ref('')
const targetX = ref('')
const targetY = ref('')
const sourceCrs = reactive<CrsConfig>({
  kind: 'epsg',
  epsgCode: '4326',
  definition: '',
})
const targetCrs = reactive<CrsConfig>({
  kind: 'epsg',
  epsgCode: '',
  definition: '',
})

const crsKindItems = [
  { label: 'EPSG Code', value: 'epsg' },
  { label: '自定义坐标系', value: 'custom' },
  { label: 'GCJ-02', value: 'gcj02' },
  { label: 'BD-09', value: 'bd09' },
]

const sourceLabel = computed(() => getCrsLabel(sourceCrs))
const targetLabel = computed(() => getCrsLabel(targetCrs))
const hasResult = computed(() => Boolean(targetX.value && targetY.value))

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
  if (config.kind === 'gcj02') {
    return 'GCJ-02'
  }

  if (config.kind === 'bd09') {
    return 'BD-09'
  }

  if (config.kind === 'epsg') {
    const code = normalizeEpsgCode(config.epsgCode)
    return code ? `EPSG:${code}` : 'EPSG Code'
  }

  return '自定义坐标系'
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

async function transformCoordinates() {
  errorMessage.value = ''
  outputText.value = ''
  targetX.value = ''
  targetY.value = ''

  try {
    const x = Number(sourceX.value)
    const y = Number(sourceY.value)
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new TypeError('请输入有效的 X/Y 坐标值')
    }

    const [sourceId, targetId] = await Promise.all([
      resolveCrs(sourceCrs, 'source'),
      resolveCrs(targetCrs, 'target'),
    ])
    const { CrsUtils } = await loadCrsUtils()
    const target = CrsUtils.transformPoint(sourceId, targetId, [x, y])
    const nextTarget = formatCoordinate([target[0]!, target[1]!])
    if (!Number.isFinite(nextTarget[0]) || !Number.isFinite(nextTarget[1])) {
      throw new TypeError('转换结果无效')
    }

    targetX.value = String(nextTarget[0])
    targetY.value = String(nextTarget[1])
    outputText.value = `${targetX.value},${targetY.value}`
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

  if (hasResult.value) {
    sourceX.value = targetX.value
    sourceY.value = targetY.value
    targetX.value = ''
    targetY.value = ''
    outputText.value = ''
  }
  errorMessage.value = ''
}
</script>

<template>
  <div class="flex w-full flex-col gap-3">
    <section class="flex min-w-0 flex-col gap-3 rounded-lg border border-muted bg-muted/20 p-3">
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="flex min-w-0 flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-medium text-highlighted">
              源坐标
            </h2>
            <span class="text-sm text-muted">{{ sourceLabel }}</span>
          </div>

          <div class="flex flex-wrap gap-2">
            <USelect v-model="sourceCrs.kind" class="w-48" :items="crsKindItems" />
            <UInput
              v-if="sourceCrs.kind === 'epsg'"
              v-model="sourceCrs.epsgCode"
              class="w-40"
              placeholder="4326"
            />
          </div>
          <UTextarea
            v-if="sourceCrs.kind === 'custom'"
            v-model="sourceCrs.definition"
            class="w-full font-mono"
            :rows="3"
            placeholder="粘贴 proj4 或 WKT 坐标系定义"
          />
          <div class="grid gap-2 sm:grid-cols-2">
            <UFormField label="X / 经度">
              <UInput v-model="sourceX" class="w-full font-mono" placeholder="116.397128" />
            </UFormField>
            <UFormField label="Y / 纬度">
              <UInput v-model="sourceY" class="w-full font-mono" placeholder="39.916527" />
            </UFormField>
          </div>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-medium text-highlighted">
              目标坐标
            </h2>
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted">{{ targetLabel }}</span>
              <UButton
                :disabled="!hasResult"
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

          <div class="flex flex-wrap gap-2">
            <USelect v-model="targetCrs.kind" class="w-48" :items="crsKindItems" />
            <UInput
              v-if="targetCrs.kind === 'epsg'"
              v-model="targetCrs.epsgCode"
              class="w-40"
              placeholder="例如 4490"
            />
          </div>
          <UTextarea
            v-if="targetCrs.kind === 'custom'"
            v-model="targetCrs.definition"
            class="w-full font-mono"
            :rows="3"
            placeholder="粘贴 proj4 或 WKT 坐标系定义"
          />
          <div class="grid gap-2 sm:grid-cols-2">
            <UFormField label="X / 经度">
              <UInput :model-value="targetX" class="w-full font-mono" readonly placeholder="-" />
            </UFormField>
            <UFormField label="Y / 纬度">
              <UInput :model-value="targetY" class="w-full font-mono" readonly placeholder="-" />
            </UFormField>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2 border-t border-muted pt-3">
        <UInput v-model.number="precision" class="w-24" type="number" :min="0" :max="12">
          <template #trailing>
            <span class="text-xs text-muted">位</span>
          </template>
        </UInput>
        <UButton icon="i-lucide:refresh-cw" color="neutral" variant="outline" @click="exchangeCrs">
          交换
        </UButton>
        <UButton color="primary" icon="i-lucide:arrow-right-left" @click="transformCoordinates">
          转换
        </UButton>
      </div>
    </section>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      icon="i-lucide:circle-alert"
    />
  </div>
</template>
