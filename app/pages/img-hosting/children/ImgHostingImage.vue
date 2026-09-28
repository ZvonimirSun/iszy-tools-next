<script setup lang="ts">
import type { ImgHostingFileItem } from './imgHosting.d'

const props = defineProps<{
  file: ImgHostingFileItem
  resolveUrl: (file: ImgHostingFileItem) => Promise<string>
  preview?: boolean
}>()

const url = ref('')
const failed = ref(false)
const retry = ref(0)
const container = ref<HTMLElement | null>(null)
const shouldLoad = ref(!!props.preview)

onMounted(() => {
  if (!props.preview) {
    const { stop } = useIntersectionObserver(container, ([entry]) => {
      if (entry?.isIntersecting) {
        shouldLoad.value = true
        stop()
      }
    }, { rootMargin: '100px' })
  }
  watch([() => props.file, () => props.resolveUrl, retry, shouldLoad], async (_, __, onCleanup) => {
    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })
    url.value = ''
    failed.value = false
    if (!shouldLoad.value)
      return
    try {
      const nextUrl = await props.resolveUrl(props.file)
      if (!cancelled) {
        url.value = nextUrl
        failed.value = !nextUrl
      }
    }
    catch {
      if (!cancelled)
        failed.value = true
    }
  }, { immediate: true })
})
</script>

<template>
  <div ref="container" class="relative flex items-center justify-center" :class="preview ? 'flex-1 min-w-0 min-h-40' : 'aspect-square w-full'">
    <div v-if="failed" class="flex flex-col items-center gap-2 text-xs text-toned p-3">
      <UIcon name="i-lucide:image-off" class="size-6" />
      <span>图片加载失败</span>
      <UButton v-if="preview" size="xs" color="neutral" variant="outline" @click.stop="retry++">
        重试
      </UButton>
    </div>
    <img
      v-else-if="url"
      :src="url"
      :alt="file.key"
      loading="eager"
      referrerpolicy="no-referrer"
      :class="preview ? 'max-w-full max-h-[70vh] object-contain rounded' : 'aspect-square object-cover w-full'"
      @error="failed = true"
    >
    <UIcon v-else name="i-lucide:loader-circle" class="size-6 animate-spin text-toned" />
  </div>
</template>
