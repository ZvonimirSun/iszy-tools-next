<script setup lang="ts">
import type { TableRow } from '@nuxt/ui'
import type { GeoJsonExportOptions, GeoJsonImportFormat } from './children/file/geoJson.types'
import type { GeoJsonCollapsedSide } from '~/stores/geoJson'
import { downloadBlob } from '~/utils/common'
import GeoJsonExportDialog from './children/components/GeoJsonExportDialog.vue'
import GeoJsonImportDialog from './children/components/GeoJsonImportDialog.vue'
import { getGeoJsonCrsCode, normalizeEpsgCode, transformGeoJsonToEpsg, withGeoJsonEpsgCode } from './children/crs'
import { exportGeoJsonFile, guessImportFormat, importGeoJsonFileByFormat } from './children/file/geoJson.file'
import { getProperties, toFeatureCollection } from './children/geoJsonUtils'
import { useGeoJsonData } from './children/useGeoJsonData'
import { canShowGeoJsonPropertyTable, useGeoJsonProperties } from './children/useGeoJsonProperties'
import 'leaflet/dist/leaflet.css'

definePageMeta({ layout: 'wide' })

type TabValue = 'json' | 'properties'

const toast = useToast()
const geoJsonStore = useGeoJsonStore()
const mapContainer = useTemplateRef('mapContainer')
const fileInput = useTemplateRef('fileInput')
const activeTab = ref<TabValue>('json')
const { geoJsonObject, geoJsonFeatureCollection, featureRows, hasFeatures, setGeoJsonObject, setFeatureCollection } = useGeoJsonData()
const pendingImportFile = shallowRef<File | null>(null)
const importDialogOpen = ref(false)
const exportDialogOpen = ref(false)
const importDefaultFormat = ref<GeoJsonImportFormat>('geojson')
const isImporting = ref(false)
const isExporting = ref(false)
const showAddPropertyDialog = ref(false)
const newPropertyKey = ref('')
const sourceEpsgCode = ref('')
const targetEpsgCode = ref('')
const isTransformingCrs = ref(false)
const selectedFeatureIndex = ref<number | null>(null)
const isDraggingDivider = ref(false)
const isMobileLayout = ref(false)
let mapHandler: Awaited<ReturnType<typeof createMapHandler>> | undefined
let renderTimer: ReturnType<typeof setTimeout> | undefined
let mediaQuery: MediaQueryList | undefined

const tabItems = [
  { label: 'JSON', value: 'json' as const },
  { label: '属性', value: 'properties' as const },
]
const { propertyTableRows, propertyColumns, propertyTableMeta } = useGeoJsonProperties(featureRows, {
  selectedFeatureIndex,
  onUpdateProperty: updateFeatureProperty,
})
const canShowPropertyTable = computed(() => canShowGeoJsonPropertyTable(geoJsonObject.value))
const collapsedSide = computed<GeoJsonCollapsedSide>({
  get() {
    return isMobileLayout.value ? geoJsonStore.mobileCollapsedSide : geoJsonStore.desktopCollapsedSide
  },
  set(val) {
    if (isMobileLayout.value) {
      geoJsonStore.mobileCollapsedSide = val
    }
    else {
      geoJsonStore.desktopCollapsedSide = val
    }
  },
})
const dividerWidth = computed(() => {
  return '1rem'
})
const layoutStyle = computed(() => {
  const bar = dividerWidth.value

  if (isMobileLayout.value) {
    if (collapsedSide.value === 'map') {
      return {
        gridTemplateColumns: `${bar} minmax(0, 1fr)`,
      }
    }

    if (collapsedSide.value === 'panel') {
      return {
        gridTemplateColumns: `minmax(0, 1fr) ${bar}`,
      }
    }

    return {
      gridTemplateColumns: `minmax(0, 1fr) ${bar}`,
    }
  }

  if (collapsedSide.value === 'map') {
    return {
      gridTemplateColumns: `${bar} minmax(0, 1fr)`,
    }
  }

  if (collapsedSide.value === 'panel') {
    return {
      gridTemplateColumns: `minmax(0, 1fr) ${bar}`,
    }
  }

  return {
    gridTemplateColumns: `minmax(0, ${geoJsonStore.leftPercent}fr) ${bar} minmax(0, ${100 - geoJsonStore.leftPercent}fr)`,
  }
})
const showMapPane = computed(() => {
  if (isMobileLayout.value) {
    return collapsedSide.value !== 'map'
  }

  return collapsedSide.value !== 'map'
})
const showPanelPane = computed(() => {
  if (isMobileLayout.value) {
    return collapsedSide.value !== 'panel'
  }

  return collapsedSide.value !== 'panel'
})
const collapseButton = computed(() => {
  if (collapsedSide.value === 'map') {
    return {
      icon: 'i-lucide:chevron-right',
      label: isMobileLayout.value ? '显示地图' : '展开地图',
    }
  }

  if (collapsedSide.value === 'panel') {
    return {
      icon: 'i-lucide:chevron-left',
      label: isMobileLayout.value ? '显示编辑器' : '展开面板',
    }
  }

  return {
    icon: 'i-lucide:grip-vertical',
    label: '调整地图和编辑器宽度',
  }
})

watch(geoJsonObject, (value) => {
  syncSourceEpsgCode(value)
}, {
  immediate: true,
})
watch(featureRows, (rows) => {
  if (selectedFeatureIndex.value != null && !rows[selectedFeatureIndex.value]) {
    selectedFeatureIndex.value = null
  }
})

function syncSourceEpsgCode(value: unknown) {
  sourceEpsgCode.value = getGeoJsonCrsCode(value) ?? ''
}

function addProperty() {
  const key = newPropertyKey.value.trim()
  if (!key) {
    toast.add({
      color: 'error',
      title: '请输入属性名',
    })
    return
  }

  const collection = toFeatureCollection(geoJsonFeatureCollection.value)
  for (const feature of collection.features) {
    const properties = getProperties(feature)
    if (!(key in properties)) {
      properties[key] = ''
    }
    feature.properties = properties
  }

  setFeatureCollection(collection)
  void renderGeoJson(collection)
  newPropertyKey.value = ''
  showAddPropertyDialog.value = false
}

function updateFeatureProperty(featureIndex: number, key: string, value: string) {
  const collection = toFeatureCollection(geoJsonFeatureCollection.value)
  const feature = collection.features[featureIndex]
  if (!feature) {
    return
  }

  const properties = getProperties(feature)
  feature.properties = {
    ...properties,
    [key]: normalizePropertyInputValue(value, properties[key]),
  }
  setFeatureCollection(collection)
}

function normalizePropertyInputValue(value: string, currentValue: unknown) {
  if (typeof currentValue === 'number') {
    const nextValue = Number(value)
    return value.trim() && Number.isFinite(nextValue) ? nextValue : value
  }

  if (typeof currentValue === 'boolean') {
    if (value === 'true') {
      return true
    }
    if (value === 'false') {
      return false
    }
    return value
  }

  if (currentValue && typeof currentValue === 'object') {
    try {
      return JSON.parse(value)
    }
    catch {
      return value
    }
  }

  return value
}

async function applySourceEpsgCode() {
  if (!sourceEpsgCode.value.trim()) {
    return
  }

  const code = normalizeEpsgCode(sourceEpsgCode.value)
  if (!code) {
    toast.add({
      color: 'error',
      title: '请输入有效的 EPSG Code',
    })
    return
  }

  const nextGeoJson = withGeoJsonEpsgCode(geoJsonObject.value, code)
  sourceEpsgCode.value = code
  setGeoJsonObject(nextGeoJson)
  await renderGeoJson(nextGeoJson)
}

async function transformCrs() {
  if (isTransformingCrs.value) {
    return
  }

  const sourceCode = normalizeEpsgCode(sourceEpsgCode.value) ?? '4326'
  const targetCode = normalizeEpsgCode(targetEpsgCode.value)
  if (!targetCode) {
    toast.add({
      color: 'error',
      title: '请输入有效的目标 EPSG Code',
    })
    return
  }

  isTransformingCrs.value = true
  try {
    const collection = await transformGeoJsonToEpsg(geoJsonObject.value, sourceCode, targetCode)
    sourceEpsgCode.value = targetCode
    targetEpsgCode.value = ''
    setFeatureCollection(collection)
    await renderGeoJson(collection)
    toast.add({
      color: 'success',
      title: '坐标转换完成',
    })
  }
  catch (error) {
    toast.add({
      color: 'error',
      title: '坐标转换失败',
      description: (error as Error).message || '请检查 EPSG Code 是否正确',
    })
  }
  finally {
    isTransformingCrs.value = false
  }
}

function handleGeoJsonUpdate(val: unknown) {
  setGeoJsonObject(val)
  syncSourceEpsgCode(val)
  if (renderTimer) {
    clearTimeout(renderTimer)
  }
  renderTimer = setTimeout(() => {
    void renderGeoJson(val)
  }, 300)
}

function openImportDialog() {
  fileInput.value?.click()
}

function openExportDialog() {
  if (!hasFeatures.value) {
    return
  }

  exportDialogOpen.value = true
}

function handleImportFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }

  pendingImportFile.value = file
  importDefaultFormat.value = guessImportFormat(file)
  importDialogOpen.value = true
}

function cancelImport() {
  pendingImportFile.value = null
}

async function importSelectedFile(format: GeoJsonImportFormat) {
  if (!pendingImportFile.value || isImporting.value) {
    return
  }

  isImporting.value = true
  try {
    const data = await importGeoJsonFileByFormat(pendingImportFile.value, format)

    setGeoJsonObject(data)
    await renderGeoJson(data)
    importDialogOpen.value = false
    pendingImportFile.value = null
    toast.add({
      color: 'success',
      title: '导入成功',
    })
  }
  catch (error) {
    toast.add({
      color: 'error',
      title: '导入失败',
      description: (error as Error).message || '文件解析失败',
    })
  }
  finally {
    isImporting.value = false
  }
}

async function exportSelectedFile(options: GeoJsonExportOptions) {
  if (isExporting.value) {
    return
  }

  isExporting.value = true
  try {
    const result = await exportGeoJsonFile(geoJsonObject.value, options)
    downloadBlob(result.blob, result.filename)

    exportDialogOpen.value = false
  }
  catch (error) {
    toast.add({
      color: 'error',
      title: '导出失败',
      description: (error as Error).message || '文件导出失败',
    })
  }
  finally {
    isExporting.value = false
  }
}

function startResize(event: PointerEvent) {
  if (isMobileLayout.value) {
    return
  }

  isDraggingDivider.value = true
  window.addEventListener('pointermove', resize)
  window.addEventListener('pointerup', stopResize, { once: true })
  resize(event)
}

function resize(event: PointerEvent) {
  const container = (event.currentTarget as HTMLElement | null)?.closest?.('.geo-json-layout')
    ?? document.querySelector<HTMLElement>('.geo-json-layout')
  const rect = container?.getBoundingClientRect()
  if (!rect) {
    return
  }

  const nextPercent = ((event.clientX - rect.left) / rect.width) * 100

  if (collapsedSide.value === 'map') {
    if (nextPercent > 20) {
      collapsedSide.value = null
      geoJsonStore.leftPercent = Math.round(Math.min(nextPercent, 80))
    }
    return
  }

  if (collapsedSide.value === 'panel') {
    if (nextPercent < 80) {
      collapsedSide.value = null
      geoJsonStore.leftPercent = Math.round(Math.max(nextPercent, 20))
    }
    return
  }

  if (nextPercent < 20) {
    collapsedSide.value = 'map'
    geoJsonStore.leftPercent = 20
    stopResize()
    return
  }

  if (nextPercent > 80) {
    collapsedSide.value = 'panel'
    geoJsonStore.leftPercent = 80
    stopResize()
    return
  }

  geoJsonStore.leftPercent = Math.round(nextPercent)
}

function stopResize() {
  isDraggingDivider.value = false
  window.removeEventListener('pointermove', resize)
}

function toggleCollapsedPane() {
  if (collapsedSide.value === 'map') {
    collapsedSide.value = isMobileLayout.value ? 'panel' : null
    geoJsonStore.leftPercent = 20
  }
  else if (collapsedSide.value === 'panel') {
    collapsedSide.value = isMobileLayout.value ? 'map' : null
    geoJsonStore.leftPercent = 80
  }
}

function resetLayout() {
  geoJsonStore.leftPercent = 50
}

function handleDividerClick() {
  if (collapsedSide.value) {
    toggleCollapsedPane()
  }
}

function updateMobileLayout(event?: MediaQueryList | MediaQueryListEvent) {
  const nextIsMobile = event?.matches ?? mediaQuery?.matches ?? false
  isMobileLayout.value = nextIsMobile

  if (nextIsMobile && geoJsonStore.mobileCollapsedSide == null) {
    geoJsonStore.mobileCollapsedSide = 'panel'
  }
}

async function renderGeoJson(val: unknown) {
  syncSourceEpsgCode(val)
  const result = await mapHandler?.renderGeoJson(val)

  if (result?.message) {
    toast.add({
      color: 'error',
      title: result.message,
    })
  }
}

function handlePropertyRowSelect(_event: Event, row: TableRow<{
  __index?: string | number
  __featureIndex?: string | number
}>) {
  const featureIndex = Number(row.original.__featureIndex)
  if (!Number.isInteger(featureIndex)) {
    return
  }

  selectFeature(featureIndex)
  if (!mapHandler?.locateFeature(featureIndex)) {
    toast.add({
      color: 'warning',
      title: '未找到对应图斑',
    })
    return
  }

  if (isMobileLayout.value) {
    collapsedSide.value = 'panel'
  }
  else if (collapsedSide.value === 'map') {
    collapsedSide.value = null
  }
}

function selectFeature(featureIndex: number, revealRow = false) {
  if (featureIndex < 0 || !featureRows.value[featureIndex]) {
    selectedFeatureIndex.value = null
    return
  }

  selectedFeatureIndex.value = featureIndex

  if (revealRow) {
    void nextTick(() => {
      document.querySelector('.geo-json-property-row-selected')?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      })
    })
  }
}

onMounted(async () => {
  mediaQuery = window.matchMedia('(max-width: 1023px)')
  updateMobileLayout(mediaQuery)
  mediaQuery.addEventListener('change', updateMobileLayout)
  await nextTick()
  if (!mapContainer.value) {
    return
  }
  mapHandler = await createMapHandler(mapContainer.value)
  await mapHandler.renderGeoJson(geoJsonObject.value)
})

onBeforeUnmount(() => {
  if (renderTimer) {
    clearTimeout(renderTimer)
  }
  mediaQuery?.removeEventListener('change', updateMobileLayout)
  window.removeEventListener('pointermove', resize)
  mapHandler?.destroy()
})

async function createMapHandler(dom: HTMLDivElement) {
  const { useGeoJsonMap } = await import('./children/useGeoJsonMap')
  return useGeoJsonMap(dom, {
    onFeatureClick(_feature, index) {
      activeTab.value = 'properties'
      selectFeature(index, true)
    },
    onGeoJsonChange(geoJson) {
      setFeatureCollection(geoJson)
      syncSourceEpsgCode(geoJson)
    },
  })
}
</script>

<template>
  <div
    class="geo-json-layout grid h-full min-h-0 w-full overflow-hidden"
    :class="[
      { 'select-none cursor-col-resize': isDraggingDivider },
    ]"
    :style="layoutStyle"
  >
    <section
      v-show="showMapPane"
      class="relative min-h-0 overflow-hidden rounded-lg border border-muted bg-default"
    >
      <div ref="mapContainer" class="h-full w-full z-0" />
      <div class="absolute left-3 top-3 z-1001 flex items-center gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide:upload"
          class="shadow-sm"
          @click="openImportDialog"
        >
          导入
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide:download"
          class="shadow-sm"
          :disabled="!hasFeatures"
          @click="openExportDialog"
        >
          导出
        </UButton>
      </div>
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        @change="handleImportFileChange"
      >
    </section>

    <button
      type="button"
      class="group flex h-full cursor-col-resize items-center justify-center bg-default transition-[width,background-color] duration-150 outline-none hover:bg-elevated/50 focus-visible:ring-2 focus-visible:ring-primary"
      :class="{ 'cursor-pointer': collapsedSide || isMobileLayout }"
      :aria-label="collapseButton.label"
      :title="collapseButton.label"
      @pointerdown.prevent="startResize"
      @click="handleDividerClick"
      @dblclick="resetLayout"
    >
      <UIcon
        :name="collapseButton.icon"
        class="size-4 text-dimmed transition-colors group-hover:text-primary"
      />
    </button>

    <aside
      v-show="showPanelPane"
      class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-muted bg-default"
    >
      <div class="grid shrink-0 gap-2 p-3 pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <UFormField label="当前 EPSG">
          <UInput
            v-model="sourceEpsgCode"
            class="w-full"
            placeholder="未定义"
            @blur="applySourceEpsgCode"
            @keydown.enter="applySourceEpsgCode"
          />
        </UFormField>
        <UFormField label="目标 EPSG">
          <UInput
            v-model="targetEpsgCode"
            class="w-full"
            placeholder="例如 3857"
            @keydown.enter="transformCrs"
          />
        </UFormField>
        <div class="flex items-end">
          <UButton
            class="w-full sm:w-auto"
            color="primary"
            variant="soft"
            icon="i-lucide:refresh-cw"
            :loading="isTransformingCrs"
            @click="transformCrs"
          >
            转换
          </UButton>
        </div>
      </div>

      <UTabs
        v-model="activeTab"
        class="shrink-0 px-3 pt-3"
        :content="false"
        :items="tabItems"
      />

      <div class="min-h-0 flex-1 overflow-hidden p-3">
        <JsonEditor
          v-show="activeTab === 'json'"
          v-model="geoJsonObject"
          class="h-full min-h-80"
          mode="text"
          @update:model-value="handleGeoJsonUpdate"
        />

        <div
          v-show="activeTab === 'properties'"
          class="flex h-full min-h-0 flex-col gap-3"
        >
          <div class="flex shrink-0 justify-end">
            <UButton
              icon="i-lucide:plus"
              color="primary"
              variant="soft"
              @click="showAddPropertyDialog = true"
            >
              添加属性
            </UButton>
          </div>

          <UTable
            v-if="canShowPropertyTable && propertyColumns.length > 1"
            :data="propertyTableRows"
            :columns="propertyColumns"
            :meta="propertyTableMeta"
            sticky
            class="min-h-0 flex-1 overflow-auto rounded-md border border-muted"
            :ui="{ tr: 'cursor-pointer whitespace-nowrap' }"
            @select="handlePropertyRowSelect"
          />

          <div
            v-else
            class="flex min-h-0 flex-1 items-center justify-center rounded-md border border-dashed border-muted text-sm text-dimmed"
          >
            暂无可展示属性
          </div>
        </div>
      </div>
    </aside>

    <UModal
      v-model:open="showAddPropertyDialog"
      title="添加属性"
    >
      <template #body>
        <UFormField label="属性名">
          <UInput
            v-model="newPropertyKey"
            class="w-full"
            placeholder="例如 name"
            @keydown.enter="addProperty"
          />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="showAddPropertyDialog = false"
          >
            取消
          </UButton>
          <UButton
            color="primary"
            @click="addProperty"
          >
            确认
          </UButton>
        </div>
      </template>
    </UModal>

    <GeoJsonImportDialog
      v-model:open="importDialogOpen"
      :file-name="pendingImportFile?.name"
      :default-format="importDefaultFormat"
      :loading="isImporting"
      @confirm="importSelectedFile"
      @cancel="cancelImport"
    />

    <GeoJsonExportDialog
      v-model:open="exportDialogOpen"
      :loading="isExporting"
      @confirm="exportSelectedFile"
    />
  </div>
</template>
