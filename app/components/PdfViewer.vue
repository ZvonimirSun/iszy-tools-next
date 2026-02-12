<script setup lang="ts">
const props = withDefaults(defineProps<{
  file: File
  alt?: string
  page?: number
  rotate?: number
}>(), {
  page: 1,
  rotate: 0,
})

const pdfManager = usePdfManager()
const imageUrl = ref('')

onBeforeUnmount(() => {
  imageUrl.value = ''
  pdfManager.releasePdf(props.file)
})

watchEffect(() => {
  getPreview()
})

async function getPreview() {
  const pdf = await pdfManager.loadPdf(props.file)
  const page = await pdf.getPage(props.page || 1)
  const scale = 2 // 清晰度，可调
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvas, viewport }).promise
  imageUrl.value = canvas.toDataURL()
}
</script>

<template>
  <img
    v-if="imageUrl"
    class="object-contain"
    :src="imageUrl"
    :alt="alt || file.name"
    :style="{
      rotate: rotate ? `${rotate}deg` : '0deg',
    }"
  >
  <div v-else class="w-full h-full flex justify-center items-center">
    <UIcon name="i-icon-park-outline-file-pdf-one" class="size-24 text-red-400" />
  </div>
</template>

<style scoped>

</style>
