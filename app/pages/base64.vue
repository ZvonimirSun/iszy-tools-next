<script setup lang="ts">
type Mode = 'encode' | 'decode'

const BASE64_PLUS_REGEX = /\+/g
const BASE64_SLASH_REGEX = /\//g
const BASE64_PADDING_REGEX = /=+$/g
const BASE64URL_MINUS_REGEX = /-/g
const BASE64URL_UNDERSCORE_REGEX = /_/g

const mode = ref<Mode>('encode')
const inputText = ref('')
const outputText = ref('')
const urlSafe = ref(false)
const errorMessage = ref('')
const { copy } = useCopy()

const modeOptions = [
  { label: 'Base64 编码（文本 → Base64）', value: 'encode' },
  { label: 'Base64 解码（Base64 → 文本）', value: 'decode' },
]

function encodeBase64(text: string, safe: boolean): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  let result = btoa(binary)
  if (safe) {
    result = result
      .replace(BASE64_PLUS_REGEX, '-')
      .replace(BASE64_SLASH_REGEX, '_')
      .replace(BASE64_PADDING_REGEX, '')
  }
  return result
}

function decodeBase64(text: string, safe: boolean): string {
  let base64 = text.trim()
  if (safe) {
    base64 = base64
      .replace(BASE64URL_MINUS_REGEX, '+')
      .replace(BASE64URL_UNDERSCORE_REGEX, '/')
  }
  const pad = base64.length % 4
  if (pad) {
    base64 += '='.repeat(4 - pad)
  }
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function process() {
  errorMessage.value = ''
  if (!inputText.value) {
    outputText.value = ''
    return
  }
  try {
    if (mode.value === 'encode') {
      outputText.value = encodeBase64(inputText.value, urlSafe.value)
    }
    else {
      outputText.value = decodeBase64(inputText.value, urlSafe.value)
    }
  }
  catch {
    outputText.value = ''
    errorMessage.value = mode.value === 'decode' ? '输入内容不是合法的 Base64 字符串，请检查后重试。' : '编码失败，请检查输入内容。'
  }
}

function swap() {
  const temp = inputText.value
  inputText.value = outputText.value
  outputText.value = temp
  mode.value = mode.value === 'encode' ? 'decode' : 'encode'
  errorMessage.value = ''
}

function clear() {
  inputText.value = ''
  outputText.value = ''
  errorMessage.value = ''
}

watch([inputText, mode, urlSafe], process)
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <!-- 模式选择 & URL-safe 选项 -->
    <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <USelect
        v-model="mode"
        :items="modeOptions"
        class="w-full sm:w-auto sm:min-w-72"
      />
      <UCheckbox v-model="urlSafe" label="URL-safe（Base64url）" class="whitespace-nowrap self-center" />
    </div>

    <!-- 输入区 -->
    <ContainerToolItem :label="mode === 'encode' ? '待编码的文本' : '待解码的 Base64 字符串'">
      <UTextarea
        v-model="inputText"
        class="w-full"
        :rows="6"
        resize
        :placeholder="mode === 'encode' ? '请输入要编码的文本...' : '请输入要解码的 Base64 字符串...'"
        autofocus
      />
    </ContainerToolItem>

    <!-- 操作按钮 -->
    <div class="flex gap-2">
      <UButton
        color="primary"
        icon="i-lucide:arrow-up-down"
        @click="swap"
      >
        交换输入 / 输出
      </UButton>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide:trash-2"
        @click="clear"
      >
        清空
      </UButton>
    </div>

    <!-- 错误提示 -->
    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      icon="i-lucide:circle-alert"
    />

    <!-- 输出区 -->
    <ContainerToolItem :label="mode === 'encode' ? 'Base64 编码结果' : '解码结果'">
      <div class="flex flex-col gap-2">
        <UTextarea
          :model-value="outputText"
          class="w-full"
          :rows="6"
          resize
          readonly
          :placeholder="mode === 'encode' ? '编码结果将显示在这里...' : '解码结果将显示在这里...'"
        />
        <div class="flex justify-end">
          <UButton
            :disabled="!outputText"
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            @click="copy(outputText)"
          >
            复制结果
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">

</style>
