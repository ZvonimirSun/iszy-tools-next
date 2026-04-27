<script setup lang="ts">
import type { ImgHostingConfig, ImgHostingFileItem } from './imgHosting.d'

defineProps<{
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

const previewOpen = ref(false)
const previewUrl = ref('')

function openPreview(url: string) {
  previewUrl.value = url
  previewOpen.value = true
}
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
      <span class="text-sm text-toned">{{ files.length }} 个文件</span>
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
        v-for="(file) in files"
        :key="file.key"
        class="group relative rounded-lg border border-muted overflow-hidden bg-muted/20"
      >
        <img
          :src="file.url"
          :alt="file.key"
          loading="lazy"
          class="aspect-square object-cover w-full cursor-pointer"
          @click="openPreview(file.url)"
        >
        <!-- 悬停操作层 -->
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center gap-1 p-2 opacity-0 group-hover:opacity-100">
          <UTooltip text="复制 URL">
            <UButton
              icon="i-lucide:copy"
              size="xs"
              color="neutral"
              variant="soft"
              @click="copyFileUrl(file)"
            />
          </UTooltip>
          <UTooltip text="删除">
            <UButton
              icon="i-lucide:trash-2"
              size="xs"
              color="error"
              variant="soft"
              @click="confirmDelete(file.key)"
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

    <!-- 空状态 -->
    <div v-else class="text-center py-12 text-sm text-toned">
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

    <!-- 图片预览 -->
    <UModal v-model:open="previewOpen" title="图片预览" :ui="{ content: 'max-w-4xl' }" fullscreen>
      <template #body>
        <img :src="previewUrl" class="max-w-full max-h-[80vh] mx-auto object-contain">
      </template>
    </UModal>
  </div>
</template>
