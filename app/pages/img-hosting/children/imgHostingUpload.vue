<script setup lang="ts">
import type { ImgHostingConfig } from './imgHosting.d'
import { getFileUrl, uploadFile } from './imgHosting.service'

const props = defineProps<{
  config: ImgHostingConfig | null
}>()

const emit = defineEmits<{
  uploaded: [item: { key: string, url: string }]
}>()

const store = useImgHostingStore()
const toast = useToast()

const loading = ref(false)
const progress = ref(0)

const { copy } = useCopy({ createToast: false })

// 按时间戳重命名文件
function renameWithTimestamp(file: File): File {
  const name = file.name || ''
  const ext = name.substring(name.lastIndexOf('.'))
  return new File([file], `${Date.now()}${ext}`.toLowerCase(), {
    type: file.type,
    lastModified: file.lastModified,
  })
}

async function handleUpload(files: FileList | File[]) {
  if (!props.config) {
    toast.add({ title: '请先选择存储配置', color: 'warning' })
    return
  }

  const fileList = Array.from(files)
  if (!fileList.length)
    return
  const config = { ...props.config, config: { ...props.config.config } }

  loading.value = true
  progress.value = 0

  for (const file of fileList) {
    try {
      const fileToUpload = store.commonConfig.renameTimeStamp ? renameWithTimestamp(file) : file

      const result = await uploadFile(config, fileToUpload, (pct) => {
        progress.value = pct
      })

      emit('uploaded', result)

      if (store.commonConfig.copyUrlAfterUpload) {
        try {
          const url = await getFileUrl(config, result)
          const template = store.commonConfig.customCopyContent
          const text = template.includes('$url') ? template.replace(/\$url/g, () => url) : url
          await copy(text)
          toast.add({ title: config.privateBucket && !config.config.customUrl?.trim() ? '上传成功，已复制签名链接，有效期 1 小时' : '上传成功，地址已复制' })
        }
        catch {
          toast.add({ title: '上传成功，但获取链接或复制失败', color: 'warning' })
        }
      }
      else {
        toast.add({ title: '上传成功' })
      }
    }
    catch (e) {
      console.error(e)
      toast.add({ title: '上传失败', color: 'error' })
    }
  }

  loading.value = false
  progress.value = 0
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) {
    handleUpload(input.files)
    input.value = ''
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer?.files) {
    handleUpload(event.dataTransfer.files)
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
}

const fileInputRef = ref<HTMLInputElement | null>(null)

function onAreaClick() {
  fileInputRef.value?.click()
}

// 粘贴监听
function onPaste(event: ClipboardEvent) {
  if (loading.value)
    return
  const items = event.clipboardData?.items
  if (!items)
    return
  const files: File[] = []
  for (const item of items) {
    if (item.type.includes('image')) {
      const file = item.getAsFile()
      if (file)
        files.push(file)
    }
  }
  if (files.length) {
    handleUpload(files)
  }
}

onMounted(() => {
  document.addEventListener('paste', onPaste)
})

onBeforeUnmount(() => {
  document.removeEventListener('paste', onPaste)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      class="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
      :class="{ 'opacity-50 pointer-events-none': loading }"
      @drop="onDrop"
      @dragover="onDragOver"
      @click="onAreaClick"
    >
      <div class="flex flex-col items-center gap-3">
        <UIcon name="i-lucide:image-up" class="size-12 text-toned" />
        <div class="text-sm text-toned">
          拖拽图片到这里上传，或直接粘贴图片
        </div>
        <UButton color="primary" variant="soft" size="sm" as="span">
          选择文件
        </UButton>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/bmp,image/gif,image/jpeg,image/png,image/webp"
          multiple
          class="hidden"
          @change="onFileChange"
        >
        <div class="text-xs text-toned">
          支持 BMP、GIF、JPEG、PNG、WebP 格式
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center gap-2">
      <UIcon name="i-lucide:loader-circle" class="size-5 animate-spin text-primary" />
      <span class="text-sm text-toned">上传中... {{ progress }}%</span>
      <UProgress v-if="progress > 0" :value="progress" class="flex-1" />
    </div>
  </div>
</template>
