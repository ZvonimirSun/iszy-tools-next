<script setup lang="ts">
type Mode = 'encode' | 'decode'

const BASE64_DATA_URL_REGEX = /^data:image\/[\w.+-]+;base64,/i
const BASE64_LOOSE_REGEX = /^[A-Z0-9+/\s=]+$/i
const BASE64_WHITESPACE_REGEX = /\s+/g

const mode = ref<Mode>('encode')
const modeOptions = [
  { label: '图片编码（图片 -> Base64）', value: 'encode' },
  { label: '图片解码（Base64 -> 图片）', value: 'decode' },
]

const imageUrl = ref('')
const encodedOutput = ref('')
const decodeInput = ref('')
const previewSrc = ref('')
const previewSize = ref({ width: '', height: '' })

const isConverting = ref(false)
const errorMessage = ref('')

const encodePreviewRef = ref<HTMLImageElement | null>(null)
const decodePreviewRef = ref<HTMLImageElement | null>(null)

const { copy } = useCopy()

const decodePreview = computed(() => {
  const text = decodeInput.value.trim()
  if (!text) {
    return ''
  }
  if (BASE64_DATA_URL_REGEX.test(text)) {
    return text
  }
  if (!BASE64_LOOSE_REGEX.test(text)) {
    return ''
  }
  return `data:image/png;base64,${text.replace(BASE64_WHITESPACE_REGEX, '')}`
})

function resetError() {
  errorMessage.value = ''
}

function resetPreviewSize() {
  previewSize.value = {
    width: '',
    height: '',
  }
}

function getSingleFile(file: File | File[] | null | undefined) {
  if (Array.isArray(file)) {
    return file[0]
  }
  return file
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('文件读取失败'))
        return
      }
      resolve(reader.result)
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

async function uploadImage(file: File | File[] | null | undefined) {
  const imageFile = getSingleFile(file)
  resetError()
  if (!imageFile) {
    encodedOutput.value = ''
    previewSrc.value = ''
    resetPreviewSize()
    return
  }

  try {
    const dataUrl = await fileToDataUrl(imageFile)
    encodedOutput.value = dataUrl
    previewSrc.value = dataUrl
  }
  catch (error) {
    encodedOutput.value = ''
    previewSrc.value = ''
    errorMessage.value = (error as Error).message || '图片编码失败'
  }
}

async function convertUrlToBase64() {
  const url = imageUrl.value.trim()
  if (!url) {
    errorMessage.value = '请输入有效的图片 URL'
    return
  }

  resetError()
  isConverting.value = true
  try {
    const blob = await $fetch<Blob>(url, {
      responseType: 'blob',
    })
    const dataUrl = await fileToDataUrl(new File([blob], 'remote-image'))
    encodedOutput.value = dataUrl
    previewSrc.value = dataUrl
  }
  catch (error) {
    errorMessage.value = (error as Error).message || '图片 URL 转换失败，请检查地址或跨域限制'
  }
  finally {
    isConverting.value = false
  }
}

function applyDecodePreview() {
  resetError()
  previewSrc.value = decodePreview.value
  resetPreviewSize()
  if (!previewSrc.value && decodeInput.value.trim()) {
    errorMessage.value = '请输入合法的 Base64 图片数据'
  }
}

function onEncodeImageLoad() {
  if (!encodePreviewRef.value) {
    return
  }
  previewSize.value.height = `${encodePreviewRef.value.naturalHeight}px`
  previewSize.value.width = `${encodePreviewRef.value.naturalWidth}px`
}

function onDecodeImageLoad() {
  if (!decodePreviewRef.value) {
    return
  }
  previewSize.value.height = `${decodePreviewRef.value.naturalHeight}px`
  previewSize.value.width = `${decodePreviewRef.value.naturalWidth}px`
}

function clearEncode() {
  imageUrl.value = ''
  encodedOutput.value = ''
  previewSrc.value = ''
  resetError()
  resetPreviewSize()
}

function clearDecode() {
  decodeInput.value = ''
  previewSrc.value = ''
  resetError()
  resetPreviewSize()
}

watch(mode, () => {
  resetError()
  previewSrc.value = ''
  resetPreviewSize()
})
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <USelect
      v-model="mode"
      :items="modeOptions"
      class="w-full sm:w-auto sm:min-w-80"
    />

    <template v-if="mode === 'encode'">
      <ContainerToolItem label="上传图片转 Base64" content-class="flex flex-col gap-3">
        <UFileUpload v-slot="{ open }" :model-value="undefined" :reset="true" :multiple="false" accept="image/*" @update:model-value="uploadImage">
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
              支持 jpg/png/webp/gif 等图片格式
            </p>
          </div>
        </UFileUpload>
      </ContainerToolItem>

      <ContainerToolItem label="图片 URL 转 Base64">
        <div class="flex flex-col sm:flex-row gap-2">
          <UInput
            v-model="imageUrl"
            class="flex-1"
            placeholder="请输入图片 URL（http:// 或 https://）"
          />
          <UButton
            color="primary"
            icon="i-lucide:link"
            :loading="isConverting"
            @click="convertUrlToBase64"
          >
            转换
          </UButton>
        </div>
      </ContainerToolItem>

      <ContainerToolItem label="Base64 结果">
        <div class="flex flex-col gap-2">
          <UTextarea
            :model-value="encodedOutput"
            class="w-full"
            :rows="7"
            resize
            readonly
            placeholder="编码结果将显示在这里..."
          />
          <div class="flex justify-end gap-2">
            <UButton
              :disabled="!encodedOutput"
              color="neutral"
              variant="outline"
              icon="i-lucide:copy"
              @click="copy(encodedOutput)"
            >
              复制结果
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
        </div>
      </ContainerToolItem>
    </template>

    <template v-else>
      <ContainerToolItem label="Base64 转图片">
        <div class="flex flex-col gap-2">
          <UTextarea
            v-model="decodeInput"
            class="w-full"
            :rows="7"
            resize
            placeholder="请输入 Data URL 或纯 Base64 图片内容..."
          />
          <div class="flex flex-wrap justify-end gap-2">
            <UButton
              color="primary"
              icon="i-lucide:image"
              @click="applyDecodePreview"
            >
              预览图片
            </UButton>
            <UButton
              :disabled="!decodeInput"
              color="neutral"
              variant="outline"
              icon="i-lucide:copy"
              @click="copy(decodeInput)"
            >
              复制输入
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide:trash-2"
              @click="clearDecode"
            >
              清空
            </UButton>
          </div>
        </div>
      </ContainerToolItem>
    </template>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      icon="i-lucide:circle-alert"
    />

    <ContainerToolItem v-if="previewSrc" label="图片预览" content-class="flex flex-col gap-3 items-start">
      <img
        v-if="mode === 'encode'"
        ref="encodePreviewRef"
        class="max-w-full h-auto rounded-lg border border-muted"
        :src="previewSrc"
        alt="preview"
        @load="onEncodeImageLoad"
      >
      <img
        v-else
        ref="decodePreviewRef"
        class="max-w-full h-auto rounded-lg border border-muted"
        :src="previewSrc"
        alt="preview"
        @load="onDecodeImageLoad"
      >
      <div class="text-sm text-muted">
        尺寸：{{ previewSize.width || '-' }} × {{ previewSize.height || '-' }}
      </div>
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">

</style>
