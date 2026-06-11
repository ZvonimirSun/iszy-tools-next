<script setup lang="ts">
type Mode = 'encode' | 'decode'

const DEFAULT_DECODE_BASE_NAME = 'decoded_file'
const DEFAULT_DECODE_FILE_NAME = 'decoded_file.bin'
const DATA_URL_PREFIX = 'data:'
const BASE64_WHITESPACE_REGEX = /\s+/g
const INVALID_FILE_NAME_CHARS_REGEX = /[<>:"/\\|?*]/g
const FILE_EXTENSION_REGEX = /\.[^/.]+$/
const WRAPPED_QUOTES_REGEX = /^"|"$/g
const RFC5987_SEPARATOR = '\'\''
const MIME_EXTENSION_MAP: Record<string, string> = {
  'application/json': 'json',
  'application/pdf': 'pdf',
  'application/xml': 'xml',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/gzip': 'gz',
  'application/octet-stream': 'bin',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'text/plain': 'txt',
  'text/html': 'html',
  'text/css': 'css',
  'text/csv': 'csv',
  'text/xml': 'xml',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

const mode = ref<Mode>('encode')
const selectedFile = ref<File>()
const encodedOutput = ref('')
const decodeInput = ref('')
const decodeUploadedContent = ref('')
const decodeUploadedFileName = ref('')
const decodeFileName = ref(DEFAULT_DECODE_FILE_NAME)
const decodeAutoFileName = ref(DEFAULT_DECODE_FILE_NAME)
const decodeFileNameTouched = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')
const decodedSize = ref(0)

let updatingDecodeFileName = false

const { copy } = useCopy()

const modeOptions = [
  { label: '文件转 Base64', value: 'encode' },
  { label: 'Base64 转文件', value: 'decode' },
]

const hasUploadedDecodeFile = computed(() => {
  return !!decodeUploadedContent.value
})

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 ** 2) {
    return `${(size / 1024).toFixed(2)} KB`
  }
  if (size < 1024 ** 3) {
    return `${(size / 1024 ** 2).toFixed(2)} MB`
  }
  return `${(size / 1024 ** 3).toFixed(2)} GB`
}

function resetMessages() {
  statusMessage.value = ''
  errorMessage.value = ''
}

function clearEncode() {
  selectedFile.value = undefined
  encodedOutput.value = ''
  resetMessages()
}

function clearDecode() {
  decodeInput.value = ''
  decodeUploadedContent.value = ''
  decodeUploadedFileName.value = ''
  decodedSize.value = 0
  setDecodeFileNameAuto(DEFAULT_DECODE_FILE_NAME)
  decodeFileNameTouched.value = false
  resetMessages()
}

function onModeChange() {
  resetMessages()
}

function fileToDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('读取文件失败'))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

function sanitizeFileName(fileName: string) {
  const sanitized = fileName.replace(INVALID_FILE_NAME_CHARS_REGEX, '_').trim()
  return sanitized || DEFAULT_DECODE_FILE_NAME
}

function getFileNameWithoutExtension(fileName: string) {
  const sanitized = sanitizeFileName(fileName)
  return sanitized.replace(FILE_EXTENSION_REGEX, '') || DEFAULT_DECODE_BASE_NAME
}

function inferExtensionFromMimeType(mimeType: string) {
  const normalizedMime = mimeType.split(';')[0]?.trim().toLowerCase() || ''
  if (!normalizedMime) {
    return 'bin'
  }
  if (MIME_EXTENSION_MAP[normalizedMime]) {
    return MIME_EXTENSION_MAP[normalizedMime]
  }
  if (normalizedMime.startsWith('text/')) {
    return 'txt'
  }
  return 'bin'
}

function buildFileName(baseName: string, extension: string) {
  const sanitizedBaseName = getFileNameWithoutExtension(baseName)
  return `${sanitizedBaseName}.${extension || 'bin'}`
}

function buildAutoDecodeFileName(baseName: string, mimeType?: string) {
  const extension = mimeType ? inferExtensionFromMimeType(mimeType) : 'bin'
  return buildFileName(baseName || DEFAULT_DECODE_BASE_NAME, extension)
}

function setDecodeFileNameAuto(fileName: string) {
  const normalized = sanitizeFileName(fileName)
  decodeAutoFileName.value = normalized
  updatingDecodeFileName = true
  decodeFileName.value = normalized
  updatingDecodeFileName = false
}

const canRestoreAutoFileName = computed(() => {
  return decodeFileNameTouched.value && decodeFileName.value.trim() !== decodeAutoFileName.value
})

function restoreDecodeAutoFileName() {
  if (!decodeAutoFileName.value) {
    return
  }
  setDecodeFileNameAuto(decodeAutoFileName.value)
  decodeFileNameTouched.value = false
}

function decodeParamValue(rawValue: string) {
  const unquoted = rawValue.replace(WRAPPED_QUOTES_REGEX, '')
  try {
    return decodeURIComponent(unquoted)
  }
  catch {
    return unquoted
  }
}

function parseDataUrl(raw: string) {
  if (!raw.toLowerCase().startsWith(DATA_URL_PREFIX)) {
    return null
  }

  const commaIndex = raw.indexOf(',')
  if (commaIndex === -1) {
    return null
  }

  const header = raw.slice(DATA_URL_PREFIX.length, commaIndex)
  const payload = raw.slice(commaIndex + 1)
  const parts = header.split(';')
  const mimeTypePart = parts[0]?.trim()
  const mimeType = mimeTypePart || 'application/octet-stream'

  let isBase64 = false
  let parsedFileName = ''

  for (const part of parts.slice(1)) {
    const segment = part.trim()
    if (!segment) {
      continue
    }

    if (segment.toLowerCase() === 'base64') {
      isBase64 = true
      continue
    }

    const equalIndex = segment.indexOf('=')
    if (equalIndex === -1) {
      continue
    }

    const key = segment.slice(0, equalIndex).trim().toLowerCase()
    const value = segment.slice(equalIndex + 1).trim()

    if ((key === 'filename' || key === 'name') && value) {
      parsedFileName = decodeParamValue(value)
      continue
    }

    if ((key === 'filename*' || key === 'name*') && value) {
      const encodedValue = value.includes(RFC5987_SEPARATOR) ? value.split(RFC5987_SEPARATOR).slice(1).join(RFC5987_SEPARATOR) : value
      parsedFileName = decodeParamValue(encodedValue)
    }
  }

  if (!isBase64) {
    return null
  }

  return {
    mimeType,
    base64: payload || '',
    fileName: parsedFileName ? sanitizeFileName(parsedFileName) : '',
  }
}

function normalizeBase64(base64: string) {
  const cleaned = base64.replace(BASE64_WHITESPACE_REGEX, '')
  const pad = cleaned.length % 4
  return pad ? `${cleaned}${'='.repeat(4 - pad)}` : cleaned
}

function base64ToBytes(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function addEncodeFile(file: File | null | undefined) {
  resetMessages()
  encodedOutput.value = ''
  if (!file) {
    selectedFile.value = undefined
    return
  }

  selectedFile.value = file
  try {
    encodedOutput.value = await fileToDataURL(file)
    statusMessage.value = `编码完成（Data URL），长度 ${encodedOutput.value.length.toLocaleString()} 字符。`
  }
  catch {
    encodedOutput.value = ''
    errorMessage.value = '文件编码失败，请重试。'
  }
}

async function copyEncodedBase64() {
  if (!encodedOutput.value) {
    return
  }
  await copy(encodedOutput.value)
}

function downloadEncodedBase64() {
  if (!encodedOutput.value) {
    return
  }
  const fileName = getFileNameWithoutExtension(selectedFile.value?.name || 'file')
  const textBlob = new Blob([encodedOutput.value], { type: 'text/plain;charset=utf-8' })
  downloadBlob(textBlob, `${fileName}.txt`)
}

async function readDecodeTextFile(file: File | null | undefined) {
  resetMessages()
  if (!file) {
    return
  }
  try {
    const uploadedText = await file.text()
    const normalizedUploadedText = uploadedText.trim()
    decodeUploadedContent.value = uploadedText
    decodeUploadedFileName.value = file.name

    const parsed = parseDataUrl(normalizedUploadedText)
    if (parsed) {
      if (parsed.fileName && (!decodeFileNameTouched.value || !decodeFileName.value.trim() || decodeFileName.value === decodeAutoFileName.value)) {
        setDecodeFileNameAuto(sanitizeFileName(parsed.fileName))
        decodeFileNameTouched.value = false
      }
      else if (!decodeFileNameTouched.value || !decodeFileName.value.trim() || decodeFileName.value === decodeAutoFileName.value) {
        setDecodeFileNameAuto(buildAutoDecodeFileName(file.name, parsed.mimeType))
        decodeFileNameTouched.value = false
      }
    }
    else if (!decodeFileNameTouched.value || !decodeFileName.value.trim() || decodeFileName.value === decodeAutoFileName.value) {
      setDecodeFileNameAuto(buildAutoDecodeFileName(file.name))
      decodeFileNameTouched.value = false
    }

    statusMessage.value = `已加载文本文件：${file.name}，已隐藏文本输入框。`
  }
  catch {
    errorMessage.value = '读取文本文件失败，请重试。'
  }
}

function decodeAndDownload() {
  resetMessages()
  decodedSize.value = 0

  const sourceText = (decodeUploadedContent.value || decodeInput.value).trim()
  if (!sourceText) {
    errorMessage.value = '请先输入 Base64 文本或上传文本文件。'
    return
  }

  let currentBase64 = sourceText
  let mimeType = 'application/octet-stream'
  let inferredFileName = ''

  const parsed = parseDataUrl(currentBase64)
  if (parsed) {
    currentBase64 = parsed.base64
    mimeType = parsed.mimeType || 'application/octet-stream'
    if (parsed.fileName && (!decodeFileNameTouched.value || !decodeFileName.value.trim() || decodeFileName.value === decodeAutoFileName.value)) {
      setDecodeFileNameAuto(sanitizeFileName(parsed.fileName))
      decodeFileNameTouched.value = false
      inferredFileName = sanitizeFileName(parsed.fileName)
    }
    else if (parsed.fileName) {
      inferredFileName = sanitizeFileName(parsed.fileName)
    }
  }

  if (!inferredFileName) {
    inferredFileName = decodeUploadedFileName.value
      ? buildAutoDecodeFileName(decodeUploadedFileName.value, parsed?.mimeType)
      : buildAutoDecodeFileName(DEFAULT_DECODE_BASE_NAME, parsed?.mimeType)
    if (!decodeFileNameTouched.value || !decodeFileName.value.trim() || decodeFileName.value === decodeAutoFileName.value) {
      setDecodeFileNameAuto(inferredFileName)
      decodeFileNameTouched.value = false
    }
  }

  const normalized = normalizeBase64(currentBase64)

  try {
    const bytes = base64ToBytes(normalized)
    const blob = new Blob([bytes], { type: mimeType })
    const filename = sanitizeFileName(decodeFileName.value.trim() || inferredFileName || DEFAULT_DECODE_FILE_NAME)
    downloadBlob(blob, filename)
    decodedSize.value = bytes.byteLength
    statusMessage.value = `解码成功，已下载 ${filename}（${formatFileSize(bytes.byteLength)}）。`
  }
  catch {
    errorMessage.value = '解码失败：输入内容不是合法的 Base64。'
  }
}

watch(decodeFileName, () => {
  if (!updatingDecodeFileName) {
    decodeFileNameTouched.value = true
  }
})
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <USelect
        v-model="mode"
        :items="modeOptions"
        class="w-full sm:w-auto sm:min-w-72"
        @update:model-value="onModeChange"
      />
    </div>

    <ContainerToolItem v-if="mode === 'encode'" label="上传文件并编码" content-class="flex flex-col gap-3">
      <UFileUpload v-slot="{ open }" :model-value="undefined" :reset="true" :multiple="false" @update:model-value="addEncodeFile">
        <div
          class="w-full p-8 border-2 border-dashed border-muted rounded-lg text-center cursor-pointer transition-colors hover:bg-elevated/50"
          role="button"
          tabindex="0"
          @click="open()"
        >
          <p class="text-base font-medium text-highlighted">
            点击或拖拽文件到这里上传
          </p>
          <p class="text-sm text-muted mt-1">
            生成 Base64 后可直接复制或下载文本
          </p>
        </div>
      </UFileUpload>

      <div v-if="selectedFile" class="text-sm text-muted break-all">
        {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
      </div>

      <div v-if="encodedOutput" class="text-sm text-muted">
        Data URL 长度：{{ encodedOutput.length.toLocaleString() }} 字符
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide:copy"
          :disabled="!encodedOutput"
          @click="copyEncodedBase64"
        >
          复制结果
        </UButton>
        <UButton
          color="primary"
          icon="i-lucide:download"
          :disabled="!encodedOutput"
          @click="downloadEncodedBase64"
        >
          下载 Data URL 文本
        </UButton>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide:trash-2"
          @click="clearEncode"
        >
          清空
        </UButton>
      </div>
    </ContainerToolItem>

    <ContainerToolItem v-else label="输入 Base64 并解码" content-class="flex flex-col gap-3">
      <UTextarea
        v-if="!hasUploadedDecodeFile"
        v-model="decodeInput"
        class="w-full"
        :rows="8"
        resize
        placeholder="优先粘贴 data:xxx;base64,...，也支持纯 Base64"
      />

      <div v-else class="text-sm text-muted break-all">
        已使用上传文本作为解码输入：{{ decodeUploadedFileName }}（输入框已隐藏，点击“清空”恢复）
      </div>

      <div class="flex flex-wrap gap-2">
        <UFileUpload v-slot="{ open }" :model-value="undefined" :reset="true" :multiple="false" @update:model-value="readDecodeTextFile">
          <UButton color="neutral" variant="outline" icon="i-lucide:file-text" @click="open()">
            {{ hasUploadedDecodeFile ? '重新上传文本' : '上传 Base64 文本' }}
          </UButton>
        </UFileUpload>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ContainerInputLike label="输出文件名">
          <div class="flex flex-col gap-2">
            <UInput
              v-model="decodeFileName"
              class="w-full"
              placeholder="例如 output.json"
            />
            <div class="flex justify-end">
              <UButton
                color="neutral"
                variant="outline"
                size="xs"
                icon="i-lucide:rotate-ccw"
                :disabled="!canRestoreAutoFileName"
                @click="restoreDecodeAutoFileName"
              >
                恢复自动推断
              </UButton>
            </div>
          </div>
        </ContainerInputLike>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton color="primary" icon="i-lucide:download" @click="decodeAndDownload">
          解码并下载文件
        </UButton>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide:trash-2"
          @click="clearDecode"
        >
          清空
        </UButton>
      </div>

      <div v-if="decodedSize" class="text-sm text-muted">
        最近一次解码大小：{{ formatFileSize(decodedSize) }}
      </div>
    </ContainerToolItem>

    <UAlert
      v-if="statusMessage"
      color="success"
      variant="soft"
      :title="statusMessage"
      icon="i-lucide:circle-check"
    />

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      icon="i-lucide:circle-alert"
    />
  </div>
</template>

<style scoped lang="scss">

</style>
