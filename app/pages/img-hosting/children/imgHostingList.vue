<script setup lang="ts">
import type { ImgHostingConfig, ImgHostingFileItem } from './imgHosting.d'

const props = defineProps<{
  files: ImgHostingFileItem[]
  config: ImgHostingConfig | null
  loading: boolean
}>()

const emit = defineEmits<{
  refresh: []
  delete: [keys: string[]]
}>()

const store = useImgHostingStore()
const { copy } = useCopy()

function copyFileUrl(file: ImgHostingFileItem) {
  let text = store.commonConfig.customCopyContent.replace(/\$url/g, file.url)
  if (text === store.commonConfig.customCopyContent && !store.commonConfig.customCopyContent.includes('$url')) {
    text = file.url
  }
  copy(text)
}

const deleteConfirmOpen = ref(false)
const deletingKey = ref<string | null>(null)

function confirmDelete(key: string) {
  deletingKey.value = key
  deleteConfirmOpen.value = true
}

function doDelete() {
  if (deletingKey.value) {
    emit('delete', [deletingKey.value])
  }
  deleteConfirmOpen.value = false
  deletingKey.value = null
}

function formatSize(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: Date): string {
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── 分页展示 ──────────────────────────────────────────
const PAGE_SIZE = 20
const displayCount = ref(PAGE_SIZE)
const displayedFiles = computed(() => props.files.slice(0, displayCount.value))
const hasMore = computed(() => displayCount.value < props.files.length)

// files 刷新时重置分页
watch(() => props.files, () => {
  displayCount.value = PAGE_SIZE
})

function loadMore() {
  if (hasMore.value) {
    displayCount.value += PAGE_SIZE
  }
}

// IntersectionObserver 监听哨兵节点
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function setupObserver() {
  if (observer) {
    observer.disconnect()
  }
  if (!sentinelRef.value)
    return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        loadMore()
      }
    },
    { rootMargin: '100px' },
  )
  observer.observe(sentinelRef.value)
}

watch(sentinelRef, (el) => {
  if (el)
    setupObserver()
})

onUnmounted(() => {
  observer?.disconnect()
})

// ── 图片预览 ──────────────────────────────────────────
const previewOpen = ref(false)
const previewIndex = ref(0)

const previewFile = computed(() => props.files[previewIndex.value] ?? null)

function openPreview(index: number) {
  previewIndex.value = index
  previewOpen.value = true
}

function prevImage() {
  if (previewIndex.value > 0)
    previewIndex.value--
}

function nextImage() {
  if (previewIndex.value < props.files.length - 1)
    previewIndex.value++
}

function onKeydown(e: KeyboardEvent) {
  if (!previewOpen.value)
    return
  if (e.key === 'ArrowLeft')
    prevImage()
  else if (e.key === 'ArrowRight')
    nextImage()
  else if (e.key === 'Escape')
    previewOpen.value = false
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 操作栏 -->
    <div class="flex items-center gap-2">
      <UButton
        icon="i-lucide:refresh-cw"
        size="sm"
        color="neutral"
        variant="outline"
        :loading="loading"
        @click="emit('refresh')"
      >
        刷新
      </UButton>
      <span class="text-sm text-toned">
        {{ files.length }} 个文件
        <template v-if="hasMore">
          （已展示 {{ displayCount }}）
        </template>
      </span>
      <span v-if="!files.length && !loading" class="text-sm text-toned">
        — 请先选择配置并刷新列表
      </span>
    </div>

    <!-- 骨架加载 -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <USkeleton v-for="i in 10" :key="i" class="rounded-lg">
        <div class="aspect-square" />
      </USkeleton>
    </div>

    <!-- 图片网格 -->
    <div
      v-else-if="files.length"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
    >
      <div
        v-for="(file, index) in displayedFiles"
        :key="file.key"
        class="group relative rounded-lg border border-muted overflow-hidden bg-muted/20 cursor-pointer"
        @click="openPreview(index)"
      >
        <img
          :src="file.url"
          :alt="file.key"
          loading="lazy"
          class="aspect-square object-cover w-full"
        >
        <!-- 悬停操作层 -->
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center gap-1 p-2 opacity-0 group-hover:opacity-100">
          <UTooltip text="复制 URL">
            <UButton
              icon="i-lucide:copy"
              size="xs"
              color="neutral"
              variant="soft"
              @click.stop="copyFileUrl(file)"
            />
          </UTooltip>
          <UTooltip text="删除">
            <UButton
              icon="i-lucide:trash-2"
              size="xs"
              color="error"
              variant="soft"
              @click.stop="confirmDelete(file.key)"
            />
          </UTooltip>
        </div>
        <!-- 文件信息 -->
        <div class="p-1.5">
          <div class="text-xs truncate" :title="file.key">
            {{ file.key }}
          </div>
          <div class="text-xs text-toned flex justify-between">
            <span>{{ formatSize(file.size) }}</span>
            <span>{{ formatDate(file.lastModified) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 哨兵节点 + 加载更多提示 -->
    <div v-if="!loading && files.length" ref="sentinelRef" class="flex justify-center py-2">
      <span v-if="hasMore" class="text-sm text-toned flex items-center gap-2">
        <UIcon name="i-lucide:loader-circle" class="size-4 animate-spin" />
        加载更多...
      </span>
      <span v-else-if="files.length > PAGE_SIZE" class="text-xs text-toned">
        已加载全部 {{ files.length }} 个文件
      </span>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && !files.length" class="text-center py-12 text-sm text-toned">
      <UIcon name="i-lucide:image" class="size-12 mx-auto mb-3 text-toned/50" />
      <p>暂无文件</p>
      <p v-if="!config">
        请先添加并选择存储配置
      </p>
    </div>

    <!-- 删除确认弹窗 -->
    <UModal v-model:open="deleteConfirmOpen" title="确认删除">
      <template #body>
        <p class="text-sm">
          确定要删除此文件吗？此操作不可撤销。
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="deleteConfirmOpen = false">
            取消
          </UButton>
          <UButton color="error" @click="doDelete">
            删除
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- 图片预览 Lightbox -->
    <UModal v-model:open="previewOpen" :ui="{ content: 'max-w-5xl' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <span class="text-sm truncate max-w-[60%]" :title="previewFile?.key">{{ previewFile?.key }}</span>
          <span class="text-xs text-toned shrink-0">{{ previewIndex + 1 }} / {{ files.length }}</span>
        </div>
      </template>
      <template #body>
        <div class="flex items-center justify-center gap-3 min-h-40">
          <UButton
            icon="i-lucide:chevron-left"
            color="neutral"
            variant="ghost"
            :disabled="previewIndex === 0"
            @click="prevImage"
          />
          <img
            v-if="previewFile"
            :src="previewFile.url"
            :alt="previewFile.key"
            class="max-w-full max-h-[70vh] object-contain rounded"
          >
          <UButton
            icon="i-lucide:chevron-right"
            color="neutral"
            variant="ghost"
            :disabled="previewIndex === files.length - 1"
            @click="nextImage"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-between items-center w-full text-xs text-toned">
          <span v-if="previewFile">{{ formatSize(previewFile.size) }} · {{ formatDate(previewFile.lastModified) }}</span>
          <UButton size="xs" color="neutral" variant="outline" @click="previewFile && copyFileUrl(previewFile)">
            <UIcon name="i-lucide:copy" class="size-3 mr-1" />复制 URL
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
