<script setup lang="ts">
import type { GeoJsonExportOptions, GeoJsonImportFormat } from './children/file/geoJson.types'
import type { GeoJsonCollapsedSide } from '~/stores/geoJson'
import { downloadBlob } from '~/utils/common'
import GeoJsonExportDialog from './children/components/GeoJsonExportDialog.vue'
import GeoJsonImportDialog from './children/components/GeoJsonImportDialog.vue'
import { exportGeoJsonFile, guessImportFormat, importGeoJsonFileByFormat } from './children/file/geoJson.file'
import { canShowGeoJsonPropertyTable, useGeoJsonProperties } from './children/useGeoJsonProperties'
import { getFeatures, getProperties, isGeometry, normalizeGeoJsonObject, toFeatureCollection } from './children/utils'
import 'leaflet/dist/leaflet.css'

definePageMeta({ layout: 'wide' })

type TabValue = 'json' | 'properties'

const toast = useToast()
const geoJsonStore = useGeoJsonStore()
const mapContainer = useTemplateRef('mapContainer')
const fileInput = useTemplateRef('fileInput')
const activeTab = ref<TabValue>('json')
const geoJsonData = shallowRef<unknown>({
  type: 'FeatureCollection',
  features: [],
})
const pendingImportFile = shallowRef<File | null>(null)
const importDialogOpen = ref(false)
const exportDialogOpen = ref(false)
const importDefaultFormat = ref<GeoJsonImportFormat>('geojson')
const isImporting = ref(false)
const isExporting = ref(false)
const showAddPropertyDialog = ref(false)
const newPropertyKey = ref('')
const isDraggingDivider = ref(false)
const isMobileLayout = ref(false)
let mapHandler: Awaited<ReturnType<typeof createMapHandler>> | undefined
let renderTimer: ReturnType<typeof setTimeout> | undefined
let mediaQuery: MediaQueryList | undefined

const tabItems = [
  { label: 'JSON', value: 'json' as const },
  { label: '属性', value: 'properties' as const },
]
const featureRows = computed(() => getFeatures(geoJsonData.value))
const hasFeatures = computed(() => {
  const data = normalizeGeoJsonObject(geoJsonData.value)
  return featureRows.value.length > 0 || isGeometry(data)
})
const { propertyTableRows, propertyColumns } = useGeoJsonProperties(featureRows)
const canShowPropertyTable = computed(() => canShowGeoJsonPropertyTable(geoJsonData.value))
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

function addProperty() {
  const key = newPropertyKey.value.trim()
  if (!key) {
    toast.add({
      color: 'error',
      title: '请输入属性名',
    })
    return
  }

  const collection = toFeatureCollection(geoJsonData.value)
  for (const feature of collection.features) {
    const properties = getProperties(feature)
    if (!(key in properties)) {
      properties[key] = ''
    }
    feature.properties = properties
  }

  geoJsonData.value = collection
  renderGeoJson(collection)
  newPropertyKey.value = ''
  showAddPropertyDialog.value = false
}

function handleGeoJsonUpdate(val: unknown) {
  geoJsonData.value = val
  if (renderTimer) {
    clearTimeout(renderTimer)
  }
  renderTimer = setTimeout(() => {
    renderGeoJson(val)
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

    geoJsonData.value = data
    renderGeoJson(data)
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
    const result = await exportGeoJsonFile(geoJsonData.value, options)
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

function renderGeoJson(val: unknown) {
  const result = mapHandler?.renderGeoJson(val)

  if (result?.message) {
    toast.add({
      color: result.status === 'too-large' ? 'warning' : 'error',
      title: result.message,
    })
  }
}

onMounted(async () => {
  mediaQuery = window.matchMedia('(max-width: 1023px)')
  updateMobileLayout(mediaQuery)
  mediaQuery.addEventListener('change', updateMobileLayout)

  if (!mapContainer.value) {
    return
  }

  mapHandler = await createMapHandler(mapContainer.value)
  mapHandler.renderGeoJson(geoJsonData.value)
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
    onFeatureClick() {
      activeTab.value = 'properties'
    },
    onGeoJsonChange(geoJson) {
      geoJsonData.value = geoJson
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
      <UTabs
        v-model="activeTab"
        class="shrink-0 px-3 pt-3"
        :content="false"
        :items="tabItems"
      />

      <div class="min-h-0 flex-1 overflow-hidden p-3">
        <JsonEditor
          v-show="activeTab === 'json'"
          v-model="geoJsonData"
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
            sticky
            class="min-h-0 flex-1 overflow-auto rounded-md border border-muted"
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
