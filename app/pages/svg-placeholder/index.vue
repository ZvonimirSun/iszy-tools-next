<script setup lang="ts">
import { createSvgDataUrl, createSvgPlaceholder } from './children/svgPlaceholder.service'

const width = ref(800)
const height = ref(450)
const text = ref('800 x 450')
const background = ref('#E5E7EB')
const foreground = ref('#111827')
const { copy } = useCopy()

const svg = computed(() => createSvgPlaceholder({
  width: width.value,
  height: height.value,
  text: text.value,
  background: background.value,
  foreground: foreground.value,
}))
const dataUrl = computed(() => createSvgDataUrl(svg.value))

function downloadSvg() {
  const blob = new Blob([svg.value], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `placeholder-${width.value}x${height.value}.svg`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
    <div class="grid gap-3 rounded-lg border border-muted bg-muted/30 p-4 md:grid-cols-3">
      <UFormField label="宽度">
        <UInputNumber v-model="width" class="w-full" :min="1" :max="10000" />
      </UFormField>
      <UFormField label="高度">
        <UInputNumber v-model="height" class="w-full" :min="1" :max="10000" />
      </UFormField>
      <UFormField label="文字">
        <UInput v-model="text" class="w-full" />
      </UFormField>
      <UFormField label="背景色">
        <UInput v-model="background" class="w-full font-mono" />
      </UFormField>
      <UFormField label="文字色">
        <UInput v-model="foreground" class="w-full font-mono" />
      </UFormField>
    </div>

    <div class="overflow-hidden rounded-lg border border-muted bg-muted/30 p-4">
      <img :src="dataUrl" alt="SVG placeholder preview" class="mx-auto max-h-80 max-w-full border border-muted">
    </div>

    <ContainerToolItem label="SVG 源码">
      <div class="flex flex-col gap-2">
        <UTextarea :model-value="svg" class="w-full font-mono" :rows="8" resize readonly />
        <div class="flex flex-wrap justify-end gap-2">
          <UButton color="neutral" variant="outline" icon="i-lucide:copy" @click="copy(svg)">
            复制 SVG
          </UButton>
          <UButton color="primary" icon="i-lucide:download" @click="downloadSvg">
            下载 SVG
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>
