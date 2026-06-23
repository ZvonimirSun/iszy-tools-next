<script setup lang="ts">
import type { QrScanner as QrScannerInstance } from '~/libs/qr-scanner'
import { renderSVG } from 'uqr'

type Mode = 'encode' | 'decode'
type DecodeSource = 'image' | 'camera'
type EccLevel = 'L' | 'M' | 'Q' | 'H'

const mode = ref<Mode>('encode')
const decodeSource = ref<DecodeSource>('image')
const modeOptions = [
  { label: '二维码编码（文本 -> 二维码）', value: 'encode' },
  { label: '二维码解码（二维码 -> 文本）', value: 'decode' },
]
const decodeSourceOptions = [
  { label: '上传图片识别', value: 'image' },
  { label: '摄像头识别', value: 'camera' },
]

const encodeText = ref('')
const ecc = ref<EccLevel>('M')
const pixelSize = ref(320)
const border = ref(2)
const eccOptions: { label: string, value: EccLevel }[] = [
  { label: 'L (7%)', value: 'L' },
  { label: 'M (15%)', value: 'M' },
  { label: 'Q (25%)', value: 'Q' },
  { label: 'H (30%)', value: 'H' },
]

const decodeResult = ref('')
const decodeError = ref('')
const isDecodingImage = ref(false)
const isLoadingScanner = ref(false)
const isStartingCamera = ref(false)
const isCameraRunning = ref(false)
const isClientReady = ref(false)

const videoEl = ref<HTMLVideoElement | null>(null)
const cameraScanner = shallowRef<QrScannerInstance | null>(null)

const { copy } = useCopy()

const normalizedPixelSize = computed(() => {
  const value = Number(pixelSize.value)
  return Number.isFinite(value) ? Math.max(120, Math.min(2048, Math.round(value))) : 320
})
const normalizedBorder = computed(() => {
  const value = Number(border.value)
  return Number.isFinite(value) ? Math.max(0, Math.min(16, Math.round(value))) : 2
})

const qrSvg = computed(() => {
  if (!encodeText.value.trim()) {
    return ''
  }
  try {
    return renderSVG(encodeText.value, {
      ecc: ecc.value,
      border: normalizedBorder.value,
      pixelSize: 1,
    })
  }
  catch {
    return ''
  }
})

const previewStyle = computed(() => ({
  width: `${normalizedPixelSize.value}px`,
  height: `${normalizedPixelSize.value}px`,
}))

function normalizeEncodeOptions() {
  pixelSize.value = normalizedPixelSize.value
  border.value = normalizedBorder.value
}

function clearEncode() {
  encodeText.value = ''
}

function clearDecodeState() {
  decodeResult.value = ''
  decodeError.value = ''
}

function getDecodeMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('No QR code found')) {
    return '未识别到二维码，请更换更清晰的图片或调整角度后重试。'
  }
  return `识别失败：${message}`
}

async function decodeImage(file: File | null | undefined) {
  if (!file) {
    return
  }

  clearDecodeState()

  isDecodingImage.value = true
  try {
    const { QrScanner } = await import('~/libs/qr-scanner')
    const result = await QrScanner.scanImage(file, {
      returnDetailedScanResult: true,
    })
    decodeResult.value = result.data
  }
  catch (error) {
    decodeError.value = getDecodeMessage(error)
  }
  finally {
    isDecodingImage.value = false
  }
}

function stopCameraScan() {
  if (cameraScanner.value) {
    cameraScanner.value.stop()
    cameraScanner.value.destroy()
    cameraScanner.value = null
  }
  isCameraRunning.value = false
}

async function startCameraScan() {
  if (!videoEl.value) {
    return
  }

  clearDecodeState()

  stopCameraScan()
  isStartingCamera.value = true
  try {
    const { QrScanner } = await import('~/libs/qr-scanner')
    cameraScanner.value = new QrScanner(videoEl.value, (result) => {
      const value = result.data
      if (!value) {
        return
      }
      decodeResult.value = value
      decodeError.value = ''
      stopCameraScan()
    }, {
      preferredCamera: 'environment',
      returnDetailedScanResult: true,
      onDecodeError: (error) => {
        if (String(error).includes('No QR code found')) {
          return
        }
        decodeError.value = getDecodeMessage(error)
      },
    })
    await cameraScanner.value.start()
    isCameraRunning.value = true
  }
  catch (error) {
    decodeError.value = getDecodeMessage(error)
    stopCameraScan()
  }
  finally {
    isStartingCamera.value = false
  }
}

async function downloadPng() {
  if (!import.meta.client || !qrSvg.value) {
    return
  }

  const svgBlob = new Blob([qrSvg.value], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    const image = await loadImage(svgUrl)
    const canvas = document.createElement('canvas')
    canvas.width = normalizedPixelSize.value
    canvas.height = normalizedPixelSize.value
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Canvas 上下文不可用')
    }

    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'qrcode.png'
    link.click()
  }
  finally {
    URL.revokeObjectURL(svgUrl)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('二维码图片生成失败'))
    image.src = url
  })
}

watch(mode, (value) => {
  if (value !== 'decode') {
    stopCameraScan()
  }
})

watch(decodeSource, (value) => {
  clearDecodeState()
  if (value !== 'camera') {
    stopCameraScan()
  }
})

onMounted(() => {
  isClientReady.value = true
})

onUnmounted(() => {
  stopCameraScan()
})
</script>

<template>
  <div class="h-full flex flex-col gap-4">
    <USelect
      v-model="mode"
      :items="modeOptions"
      class="w-full"
    />

    <div class="flex-1 overflow-y-auto flex flex-col gap-4">
      <template v-if="mode === 'encode'">
        <ContainerToolItem label="待编码文本">
          <UTextarea
            v-model="encodeText"
            class="w-full"
            :rows="6"
            resize
            placeholder="请输入需要生成二维码的文本..."
            autofocus
          />
        </ContainerToolItem>

        <div class="grid gap-2 md:grid-cols-3">
          <UFormField label="纠错等级">
            <USelect v-model="ecc" :items="eccOptions" class="w-full" />
          </UFormField>
          <UFormField label="图片尺寸 (px)">
            <UInput v-model.number="pixelSize" type="number" :min="120" :max="2048" @blur="normalizeEncodeOptions" />
          </UFormField>
          <UFormField label="边距 (模块数)">
            <UInput v-model.number="border" type="number" :min="0" :max="16" @blur="normalizeEncodeOptions" />
          </UFormField>
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            color="primary"
            icon="i-lucide:image-down"
            :disabled="!qrSvg"
            @click="downloadPng"
          >
            下载 PNG
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:trash-2"
            @click="clearEncode"
          >
            清空
          </UButton>
        </div>

        <ContainerToolItem label="二维码预览" content-class="flex items-center justify-center">
          <div
            v-if="qrSvg"
            class="border border-muted rounded-lg p-2 bg-white overflow-hidden"
            :style="previewStyle"
            v-html="qrSvg"
          />
          <div v-else class="text-sm text-muted">
            输入文本后自动生成二维码
          </div>
        </ContainerToolItem>
      </template>

      <template v-else>
        <USelect
          v-model="decodeSource"
          :items="decodeSourceOptions"
          class="w-full sm:w-auto sm:min-w-72"
        />

        <div class="flex-1 overflow-y-auto flex flex-col gap-4">
          <template v-if="decodeSource === 'image'">
            <ContainerToolItem label="上传二维码图片" content-class="flex flex-col gap-2">
              <UFileUpload v-slot="{ open }" :model-value="undefined" :reset="true" :multiple="false" accept="image/*" @update:model-value="decodeImage">
                <div
                  class="w-full p-8 border-2 border-dashed border-muted rounded-lg text-center cursor-pointer transition-colors hover:bg-elevated/50"
                  role="button"
                  tabindex="0"
                  @click="open()"
                >
                  <p class="text-base font-medium text-highlighted">
                    点击或拖拽二维码图片到这里
                  </p>
                  <p class="text-sm text-muted mt-1">
                    {{ isDecodingImage ? '识别中，请稍候...' : '仅返回第一个识别结果' }}
                  </p>
                </div>
              </UFileUpload>
            </ContainerToolItem>
          </template>

          <template v-else>
            <ContainerToolItem label="摄像头识别" content-class="flex flex-col gap-2 items-center">
              <ClientOnly>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    color="primary"
                    icon="i-lucide:camera"
                    :loading="isStartingCamera || isLoadingScanner"
                    :disabled="isCameraRunning"
                    @click="startCameraScan"
                  >
                    开始识别
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-lucide:square"
                    :disabled="!isCameraRunning"
                    @click="stopCameraScan"
                  >
                    停止
                  </UButton>
                </div>
                <template #fallback>
                  <div class="text-sm text-muted">
                    客户端加载后可启用摄像头识别。
                  </div>
                </template>
              </ClientOnly>
              <div class="text-xs text-muted">
                摄像头识别仅返回第一个二维码结果。
              </div>
              <div class="w-full max-w-xs sm:max-w-sm mx-auto bg-black/90 rounded-lg overflow-hidden aspect-4/3">
                <video ref="videoEl" class="w-full h-full object-cover" playsinline muted />
              </div>
            </ContainerToolItem>
          </template>

          <UAlert
            v-if="decodeError"
            color="error"
            variant="soft"
            :title="decodeError"
            icon="i-lucide:circle-alert"
          />

          <ContainerToolItem label="识别结果">
            <div class="flex flex-col gap-2">
              <UTextarea
                :model-value="decodeResult"
                class="w-full"
                :rows="6"
                resize
                readonly
                :placeholder="isClientReady ? '识别结果将显示在这里...' : '客户端加载后可开始识别...'"
              />
              <div class="flex justify-end">
                <UButton
                  :disabled="!decodeResult"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide:copy"
                  @click="copy(decodeResult)"
                >
                  复制结果
                </UButton>
              </div>
            </div>
          </ContainerToolItem>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
