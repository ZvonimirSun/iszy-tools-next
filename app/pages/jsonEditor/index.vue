<script setup lang="ts">
import { recordContentToEditorValue, valueToStoreValue } from './children/jsonEditor.utils'
import JsonEditorPane from './children/JsonEditorPane.vue'

definePageMeta({ layout: 'wide' })

type CollapsedSide = 'left' | 'right' | null

const store = useJsonEditorStore()
const layoutRef = useTemplateRef('layoutRef')
const dividerRef = useTemplateRef('dividerRef')
const isDraggingDivider = ref(false)
const isMobileLayout = ref(false)
const isSyncLoading = ref(false)
const syncPulled = ref(false)
let resizeObserver: ResizeObserver | undefined
let pendingResizeEvent: PointerEvent | undefined
let resizeFrame: number | undefined
let suppressNextDividerClick = false
let dragStartClientX = 0
let hasDraggedDivider = false

const minPaneWidth = 450
const fallbackDividerWidth = 44
const minSplitterRatio = 0
const maxSplitterRatio = 1

const collapsedSide = computed<CollapsedSide>({
  get() {
    if (store.fullStatus === 'left' || store.fullStatus === 'right') {
      return store.fullStatus
    }

    return null
  },
  set(val) {
    store.setFullStatus(val)
  },
})
const layoutStyle = computed(() => {
  if (isMobileLayout.value) {
    return {
      gridTemplateColumns: 'minmax(0, 1fr)',
    }
  }

  if (collapsedSide.value === 'left') {
    return {
      gridTemplateColumns: '2.75rem minmax(0, 1fr)',
    }
  }

  if (collapsedSide.value === 'right') {
    return {
      gridTemplateColumns: 'minmax(0, 1fr) 2.75rem',
    }
  }

  return {
    gridTemplateColumns: `minmax(0, ${store.splitterValue}fr) 2.75rem minmax(0, ${1 - store.splitterValue}fr)`,
  }
})
const showLeftPane = computed(() => {
  return isMobileLayout.value || collapsedSide.value !== 'left'
})
const showRightPane = computed(() => {
  return !isMobileLayout.value && collapsedSide.value !== 'right'
})
const dividerButton = computed(() => {
  if (collapsedSide.value === 'left') {
    return {
      icon: 'i-lucide:chevron-right',
      label: '展开左侧编辑器',
    }
  }

  if (collapsedSide.value === 'right') {
    return {
      icon: 'i-lucide:chevron-left',
      label: '展开右侧编辑器',
    }
  }

  return {
    icon: 'i-lucide:grip-vertical',
    label: '调整编辑器宽度',
  }
})

onMounted(() => {
  updateMobileLayout()
  pullCloudDataIfNeeded()

  if (layoutRef.value) {
    resizeObserver = new ResizeObserver(updateMobileLayout)
    resizeObserver.observe(layoutRef.value)
  }

  window.addEventListener('resize', updateMobileLayout)
})

watch(() => store.syncCloud, () => {
  pullCloudDataIfNeeded()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateMobileLayout)
  window.removeEventListener('pointermove', resize)
  window.removeEventListener('pointerup', stopResize)
  window.removeEventListener('pointercancel', stopResize)
  cancelResizeFrame()
})

function copyLeftToRight() {
  copyRecord('left', 'right')
}

function copyRightToLeft() {
  copyRecord('right', 'left')
}

function copyRecord(from: 'left' | 'right', to: 'left' | 'right') {
  const sourceId = from === 'left' ? store.leftId : store.rightId
  const source = sourceId ? store.data(sourceId) : null
  if (!source) {
    return
  }

  const content = recordContentToEditorValue(source.content)
  const id = store.saveData({
    left: to === 'left',
    right: to === 'right',
    content: valueToStoreValue(content),
    name: `${source.name} 副本`,
    indentation: source.indentation,
  })

  if (id) {
    if (to === 'left') {
      store.leftId = id
    }
    else {
      store.rightId = id
    }
  }
}

function startResize(event: PointerEvent) {
  if (isMobileLayout.value) {
    return
  }

  isDraggingDivider.value = true
  dragStartClientX = event.clientX
  hasDraggedDivider = false
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  window.addEventListener('pointermove', resize)
  window.addEventListener('pointerup', stopResize, { once: true })
  window.addEventListener('pointercancel', stopResize, { once: true })
  resize(event)
}

function handleDividerPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement
  if (target.closest('[data-json-editor-bar-action]')) {
    return
  }

  startResize(event)
}

function resize(event: PointerEvent) {
  pendingResizeEvent = event
  if (resizeFrame != null) {
    return
  }

  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = undefined
    if (pendingResizeEvent) {
      updateSplitterFromPointer(pendingResizeEvent)
    }
  })
}

function updateSplitterFromPointer(event: PointerEvent) {
  const rect = layoutRef.value?.getBoundingClientRect()
  if (!rect) {
    return
  }

  if (Math.abs(event.clientX - dragStartClientX) > 3) {
    hasDraggedDivider = true
  }

  const dividerWidth = getDividerWidth()
  const contentWidth = Math.max(rect.width - dividerWidth, 1)
  const nextRatio = (event.clientX - rect.left - dividerWidth / 2) / contentWidth
  store.setSplitter(clampSplitterRatio(nextRatio))
  applyCollapsedStateByWidth()
}

function getDividerWidth() {
  return dividerRef.value?.getBoundingClientRect().width ?? fallbackDividerWidth
}

function clampSplitterRatio(value: number) {
  return Math.min(Math.max(value, minSplitterRatio), maxSplitterRatio)
}

function stopResize() {
  if (!isDraggingDivider.value) {
    return
  }

  cancelResizeFrame()
  if (pendingResizeEvent) {
    updateSplitterFromPointer(pendingResizeEvent)
  }
  pendingResizeEvent = undefined
  isDraggingDivider.value = false
  suppressNextDividerClick = hasDraggedDivider
  hasDraggedDivider = false
  window.removeEventListener('pointermove', resize)
  window.removeEventListener('pointerup', stopResize)
  window.removeEventListener('pointercancel', stopResize)
}

function applyCollapsedStateByWidth() {
  const rect = layoutRef.value?.getBoundingClientRect()
  if (!rect) {
    return
  }

  const contentWidth = Math.max(rect.width - getDividerWidth(), 1)
  const leftWidth = contentWidth * store.splitterValue
  const rightWidth = contentWidth - leftWidth

  if (leftWidth < minPaneWidth) {
    collapsedSide.value = 'left'
    return
  }

  if (rightWidth < minPaneWidth) {
    collapsedSide.value = 'right'
    return
  }

  collapsedSide.value = null
}

function cancelResizeFrame() {
  if (resizeFrame != null) {
    cancelAnimationFrame(resizeFrame)
    resizeFrame = undefined
  }
}

function handleDividerClick() {
  if (suppressNextDividerClick) {
    suppressNextDividerClick = false
    return
  }

  const side = collapsedSide.value
  if (!side) {
    return
  }

  expandCollapsedSide(side)
  collapsedSide.value = null
}

function expandCollapsedSide(side: Exclude<CollapsedSide, null>) {
  const rect = layoutRef.value?.getBoundingClientRect()
  const contentWidth = Math.max((rect?.width ?? window.innerWidth) - getDividerWidth(), 1)
  const expandedRatio = (minPaneWidth + 1) / contentWidth

  if (side === 'left') {
    store.setSplitter(clampSplitterRatio(expandedRatio))
    return
  }

  store.setSplitter(clampSplitterRatio(1 - expandedRatio))
}

function resetLayout() {
  collapsedSide.value = null
  store.setSplitter(0.5)
}

function updateMobileLayout() {
  const layoutWidth = layoutRef.value?.getBoundingClientRect().width ?? window.innerWidth
  isMobileLayout.value = layoutWidth < minPaneWidth * 2 + getDividerWidth()
}

async function pullCloudDataIfNeeded() {
  if (!store.syncCloud || syncPulled.value || isSyncLoading.value) {
    return
  }

  isSyncLoading.value = true
  try {
    await store.getSyncData()
    syncPulled.value = true
  }
  finally {
    isSyncLoading.value = false
  }
}
</script>

<template>
  <ClientOnly>
    <div
      ref="layoutRef"
      class="json-editor-layout relative grid h-full min-h-0 w-full gap-0 overflow-hidden"
      :class="{ 'select-none cursor-col-resize': isDraggingDivider }"
      :style="layoutStyle"
    >
      <JsonEditorPane
        v-show="showLeftPane"
        side="left"
        class="min-h-0"
      />

      <div
        ref="dividerRef"
        class="group flex min-h-0 flex-col items-center justify-center gap-2 border-x border-muted bg-muted/30 outline-none hover:bg-elevated/50 focus-visible:ring-2 focus-visible:ring-primary"
        :class="[
          isMobileLayout ? 'hidden' : '',
          collapsedSide ? 'cursor-pointer' : 'cursor-col-resize',
        ]"
        :aria-label="dividerButton.label"
        :title="dividerButton.label"
        role="button"
        tabindex="0"
        @pointerdown.prevent="handleDividerPointerDown"
        @click="handleDividerClick"
        @dblclick="resetLayout"
        @keydown.enter.prevent="handleDividerClick"
        @keydown.space.prevent="handleDividerClick"
      >
        <div v-show="!collapsedSide" class="flex flex-col items-center gap-2">
          <UTooltip text="复制左侧到右侧">
            <UButton
              data-json-editor-bar-action
              icon="i-lucide:arrow-right"
              color="neutral"
              variant="ghost"
              class="cursor-pointer disabled:cursor-not-allowed"
              aria-label="复制左侧到右侧"
              :disabled="!store.leftId"
              @click="copyLeftToRight"
            />
          </UTooltip>
          <UTooltip text="复制右侧到左侧">
            <UButton
              data-json-editor-bar-action
              icon="i-lucide:arrow-left"
              color="neutral"
              variant="ghost"
              class="cursor-pointer disabled:cursor-not-allowed"
              aria-label="复制右侧到左侧"
              :disabled="!store.rightId"
              @click="copyRightToLeft"
            />
          </UTooltip>
        </div>
        <UTooltip :text="dividerButton.label">
          <div class="flex h-16 w-full items-center justify-center">
            <UIcon
              :name="dividerButton.icon"
              class="size-4 text-dimmed transition-colors group-hover:text-primary"
            />
          </div>
        </UTooltip>
      </div>

      <JsonEditorPane
        v-show="showRightPane"
        side="right"
        class="min-h-0"
      />

      <div
        v-if="isSyncLoading"
        class="absolute inset-0 z-10 flex items-center justify-center bg-default/75 backdrop-blur-sm"
      >
        <div class="flex items-center gap-2 rounded-md border border-muted bg-default px-4 py-3 text-sm text-highlighted shadow-sm">
          <UIcon name="i-lucide:loader-circle" class="size-4 animate-spin text-primary" />
          <span>正在同步云端记录</span>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
