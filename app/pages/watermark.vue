<script setup lang="ts">
import { downloadBlob } from '~/utils/common'

definePageMeta({
  layout: 'full',
})

const toast = useToast()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const sourceFile = ref<File | null>(null)
const sourceImage = shallowRef<HTMLImageElement | null>(null)
const sourceObjectUrl = ref('')

const watermarkText = ref('仅供参考')
const fontSize = ref(32)
const color = ref('#000000')
const opacity = ref(0.2)
const rotateDeg = ref(-30)
const spacing = ref(80)

const isRendering = ref(false)

const canDownload = computed(() => {
  return Boolean(sourceImage.value && canvasRef.value)
})

const normalizedFontSize = computed(() => {
  const value = Number(fontSize.value)
  if (!Number.isFinite(value)) {
    return 32
  }
  return Math.min(200, Math.max(8, Math.round(value)))
})

const normalizedOpacity = computed(() => {
  const value = Number(opacity.value)
  if (!Number.isFinite(value)) {
    return 0.2
  }
  return Math.min(1, Math.max(0, Number(value.toFixed(2))))
})

const normalizedRotateDeg = computed(() => {
  const value = Number(rotateDeg.value)
  if (!Number.isFinite(value)) {
    return -30
  }
  return Math.min(180, Math.max(-180, Math.round(value)))
})

const normalizedSpacing = computed(() => {
  const value = Number(spacing.value)
  if (!Number.isFinite(value)) {
    return 80
  }
  return Math.min(400, Math.max(0, Math.round(value)))
})

function getSingleFile(file: File | File[] | null | undefined) {
  if (Array.isArray(file)) {
    return file[0]
  }
  return file
}

function revokeSourceObjectUrl() {
  if (sourceObjectUrl.value) {
    URL.revokeObjectURL(sourceObjectUrl.value)
    sourceObjectUrl.value = ''
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片读取失败，请换一张图片重试。'))
    image.src = url
  })
}

async function onUpload(file: File | File[] | null | undefined) {
  const imageFile = getSingleFile(file)
  sourceFile.value = null
  sourceImage.value = null

  if (!imageFile) {
    revokeSourceObjectUrl()
    return
  }

  revokeSourceObjectUrl()

  try {
    const objectUrl = URL.createObjectURL(imageFile)
    const image = await loadImage(objectUrl)
    sourceObjectUrl.value = objectUrl
    sourceFile.value = imageFile
    sourceImage.value = image
    await renderPreview()
  }
  catch (error) {
    revokeSourceObjectUrl()
    toast.add({
      color: 'error',
      title: (error as Error).message || '图片读取失败',
      icon: 'i-lucide:circle-alert',
    })
  }
}

function normalizeInputValues() {
  fontSize.value = normalizedFontSize.value
  opacity.value = normalizedOpacity.value
  rotateDeg.value = normalizedRotateDeg.value
  spacing.value = normalizedSpacing.value
}

async function renderPreview() {
  if (!sourceImage.value) {
    return
  }

  // Wait for the canvas node to mount on first upload.
  if (!canvasRef.value) {
    await nextTick()
  }
  if (!canvasRef.value) {
    return
  }

  isRendering.value = true
  try {
    const canvas = canvasRef.value
    const image = sourceImage.value
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Canvas 上下文不可用')
    }

    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const text = watermarkText.value.trim()
    if (!text) {
      return
    }

    const textSize = normalizedFontSize.value
    const gap = normalizedSpacing.value

    context.save()
    context.fillStyle = color.value || '#000000'
    context.globalAlpha = normalizedOpacity.value
    context.font = `${textSize}px sans-serif`
    context.textAlign = 'center'
    context.textBaseline = 'middle'

    const metrics = context.measureText(text)
    const textWidth = Math.max(1, metrics.width)
    const textHeight = Math.max(
      1,
      (metrics.actualBoundingBoxAscent || textSize * 0.8)
      + (metrics.actualBoundingBoxDescent || textSize * 0.2),
    )

    const stepX = textWidth + gap
    const stepY = textHeight + gap

    const radius = Math.hypot(canvas.width, canvas.height)
    context.translate(canvas.width / 2, canvas.height / 2)
    context.rotate(normalizedRotateDeg.value * Math.PI / 180)

    for (let y = -radius; y <= radius; y += stepY) {
      for (let x = -radius; x <= radius; x += stepX) {
        context.fillText(text, x, y)
      }
    }

    context.restore()
  }
  finally {
    isRendering.value = false
  }
}

async function downloadPng() {
  if (!canvasRef.value || !sourceImage.value) {
    return
  }

  await renderPreview()

  canvasRef.value.toBlob((blob) => {
    if (!blob) {
      toast.add({
        color: 'error',
        title: 'PNG 导出失败，请重试。',
        icon: 'i-lucide:circle-alert',
      })
      return
    }
    const filename = sourceFile.value
      ? `${sourceFile.value.name.replace(/\.[^.]+$/, '') || 'watermark'}_watermark.png`
      : 'watermark.png'
    downloadBlob(blob, filename)
  }, 'image/png')
}

function resetOptions() {
  watermarkText.value = '仅供参考'
  fontSize.value = 32
  color.value = '#000000'
  opacity.value = 0.2
  rotateDeg.value = -30
  spacing.value = 80
}

watch([
  watermarkText,
  color,
  sourceImage,
  normalizedFontSize,
  normalizedOpacity,
  normalizedRotateDeg,
  normalizedSpacing,
], () => {
  void renderPreview()
}, {
  flush: 'post',
})

onBeforeUnmount(() => {
  revokeSourceObjectUrl()
})
</script>

<template>
  <div class="h-full overflow-auto flex flex-col gap-4">
    <ContainerToolItem label="上传图片" content-class="flex flex-col gap-3">
      <UFileUpload v-slot="{ open }" :model-value="undefined" :reset="true" :multiple="false" accept="image/*" @update:model-value="onUpload">
        <div
          class="w-full p-8 border-2 border-dashed border-muted rounded-lg text-center cursor-pointer transition-colors hover:bg-elevated/50"
          role="button"
          tabindex="0"
          @click="open()"
        >
          <p class="text-base font-medium text-highlighted">
            点击或拖拽图片到这里
          </p>
          <p class="text-sm text-muted mt-1">
            支持常见图片格式
          </p>
        </div>
      </UFileUpload>
      <div v-if="sourceFile" class="text-sm text-muted break-all">
        {{ sourceFile.name }}
      </div>
    </ContainerToolItem>

    <ContainerToolItem label="水印参数" content-class="flex flex-col gap-3">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <UFormField label="水印文字">
          <UInput
            v-model="watermarkText"
            class="w-full"
            placeholder="请输入水印文字"
          />
        </UFormField>

        <UFormField label="字号">
          <UInputNumber
            v-model="fontSize"
            class="w-full"
            orientation="vertical"
            :min="8"
            :max="200"
            :step="1"
            :step-strictly="true"
            @blur="normalizeInputValues"
          />
        </UFormField>

        <UFormField label="颜色（默认黑）">
          <div class="h-9 px-2 rounded-md border border-default bg-default flex items-center gap-2">
            <input
              v-model="color"
              type="color"
              class="h-6 w-10 cursor-pointer border-0 bg-transparent"
            >
            <span class="font-mono text-xs text-muted">{{ color }}</span>
          </div>
        </UFormField>

        <UFormField label="透明度 (0-1)">
          <div class="flex items-center gap-3">
            <USlider
              v-model="opacity"
              :min="0"
              :max="1"
              :step="0.01"
              class="flex-1"
            />
            <span class="text-sm w-10 text-right">{{ normalizedOpacity.toFixed(2) }}</span>
          </div>
        </UFormField>

        <UFormField label="旋转角度">
          <UInputNumber
            v-model="rotateDeg"
            class="w-full"
            orientation="vertical"
            :min="-180"
            :max="180"
            :step="1"
            :step-strictly="true"
            @blur="normalizeInputValues"
          />
        </UFormField>

        <UFormField label="文本间距">
          <UInputNumber
            v-model="spacing"
            class="w-full"
            orientation="vertical"
            :min="0"
            :max="400"
            :step="1"
            :step-strictly="true"
            @blur="normalizeInputValues"
          />
        </UFormField>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide:rotate-ccw"
          @click="resetOptions"
        >
          重置参数
        </UButton>
        <UButton
          color="primary"
          icon="i-lucide:download"
          :disabled="!canDownload"
          :loading="isRendering"
          @click="downloadPng"
        >
          导出 PNG
        </UButton>
      </div>
    </ContainerToolItem>

    <ContainerToolItem label="预览" content-class="flex items-center justify-center">
      <canvas
        v-if="sourceImage"
        ref="canvasRef"
        class="max-w-full h-auto rounded-lg border border-muted bg-white"
      />
      <div v-else class="text-sm text-muted">
        请先上传一张图片
      </div>
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">

</style>
