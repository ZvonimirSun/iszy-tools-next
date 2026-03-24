<script setup lang="ts">
import CryptoJS from 'crypto-js'

type Mode = 'encode' | 'decode'
type StatusType = 'neutral' | 'success' | 'warning'

const BASE64_PLUS_REGEX = /\+/g
const BASE64_SLASH_REGEX = /\//g
const BASE64URL_MINUS_REGEX = /-/g
const BASE64URL_UNDERSCORE_REGEX = /_/g
const BASE64_PADDING_REGEX = /=+$/g

const mode = ref<Mode>('decode')
const secret = ref('')

const headerInput = ref(JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2))
const payloadInput = ref(JSON.stringify({ sub: '1234567890', name: 'John Doe', iat: 1516239022 }, null, 2))
const tokenInput = ref('')

const encodedToken = ref('')
const decodedHeader = ref('')
const decodedPayload = ref('')

const errorMessage = ref('')
const statusMessage = ref('')
const statusType = ref<StatusType>('neutral')

const modeOptions = [
  { label: 'JWT 加密（HS256）', value: 'encode' },
  { label: 'JWT 解密', value: 'decode' },
]

function clearMessages() {
  errorMessage.value = ''
  statusMessage.value = ''
  statusType.value = 'neutral'
}

function encodeBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes)
    binary += String.fromCharCode(byte)

  return btoa(binary)
    .replace(BASE64_PLUS_REGEX, '-')
    .replace(BASE64_SLASH_REGEX, '_')
    .replace(BASE64_PADDING_REGEX, '')
}

function decodeBase64Url(input: string) {
  const base64 = input
    .replace(BASE64URL_MINUS_REGEX, '+')
    .replace(BASE64URL_UNDERSCORE_REGEX, '/')
    .padEnd(Math.ceil(input.length / 4) * 4, '=')

  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function signHs256(data: string, jwtSecret: string) {
  const digest = CryptoJS.HmacSHA256(data, jwtSecret)
  const base64 = CryptoJS.enc.Base64.stringify(digest)
  return base64
    .replace(BASE64_PLUS_REGEX, '-')
    .replace(BASE64_SLASH_REGEX, '_')
    .replace(BASE64_PADDING_REGEX, '')
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length)
    return false

  let mismatch = 0
  for (let i = 0; i < a.length; i++)
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)

  return mismatch === 0
}

function formatJsonOrRaw(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  }
  catch {
    return value
  }
}

function encodeJwt() {
  clearMessages()
  encodedToken.value = ''

  if (!secret.value.trim()) {
    errorMessage.value = '请先输入密码（secret）再加密。'
    return
  }

  try {
    const header = JSON.parse(headerInput.value)
    const payload = JSON.parse(payloadInput.value)

    if (header.alg !== 'HS256') {
      errorMessage.value = '当前仅支持 HS256 加密，请将 header.alg 设置为 HS256。'
      return
    }

    const headerSegment = encodeBase64Url(JSON.stringify(header))
    const payloadSegment = encodeBase64Url(JSON.stringify(payload))
    const signingInput = `${headerSegment}.${payloadSegment}`
    const signature = signHs256(signingInput, secret.value)

    encodedToken.value = `${signingInput}.${signature}`
    tokenInput.value = encodedToken.value
    statusType.value = 'success'
    statusMessage.value = 'JWT 生成成功，已完成 HS256 签名。'
  }
  catch {
    errorMessage.value = 'Header 或 Payload 不是合法 JSON，请检查后重试。'
  }
}

function decodeJwt() {
  clearMessages()
  decodedHeader.value = ''
  decodedPayload.value = ''

  const token = tokenInput.value.trim()
  if (!token) {
    errorMessage.value = '请先输入 JWT。'
    return
  }

  const parts = token.split('.')
  if (parts.length < 2) {
    errorMessage.value = 'JWT 格式不正确，至少应包含 header 和 payload。'
    return
  }

  const headerSegment = parts[0] ?? ''
  const payloadSegment = parts[1] ?? ''
  const signature = parts[2] ?? ''

  let headerText = ''
  let payloadText = ''
  try {
    headerText = decodeBase64Url(headerSegment)
    payloadText = decodeBase64Url(payloadSegment)
  }
  catch {
    errorMessage.value = 'JWT 的 header 或 payload 不是合法的 Base64URL。'
    return
  }

  decodedHeader.value = formatJsonOrRaw(headerText)
  decodedPayload.value = formatJsonOrRaw(payloadText)

  if (!secret.value.trim()) {
    statusType.value = 'warning'
    statusMessage.value = '未输入密码，已展示明文内容（未校验签名）。'
    return
  }

  let alg = ''
  try {
    const header = JSON.parse(headerText)
    alg = header.alg
  }
  catch {
    statusType.value = 'warning'
    statusMessage.value = '已展示明文内容，但 header 非 JSON，无法校验签名。'
    return
  }

  if (alg !== 'HS256') {
    statusType.value = 'warning'
    statusMessage.value = `已展示明文内容，当前仅支持 HS256 验签（当前 alg: ${alg || 'unknown'}）。`
    return
  }

  if (!signature) {
    statusType.value = 'warning'
    statusMessage.value = '已展示明文内容，但 JWT 缺少签名段，无法校验。'
    return
  }

  const signingInput = `${headerSegment}.${payloadSegment}`
  const expected = signHs256(signingInput, secret.value)
  const valid = safeEqual(expected, signature)

  statusType.value = valid ? 'success' : 'warning'
  statusMessage.value = valid ? '签名校验通过。' : '签名校验失败，密码可能不正确。'
}

function clearAll() {
  headerInput.value = JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2)
  payloadInput.value = JSON.stringify({ sub: '1234567890', name: 'John Doe', iat: 1516239022 }, null, 2)
  tokenInput.value = ''
  encodedToken.value = ''
  decodedHeader.value = ''
  decodedPayload.value = ''
  clearMessages()
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="grid gap-3 md:grid-cols-2">
      <UFormField label="模式">
        <USelect v-model="mode" :items="modeOptions" class="w-full" />
      </UFormField>
      <UFormField label="密码（secret）">
        <UInput
          v-model="secret"
          class="w-full"
          type="password"
          placeholder="解密可不填；加密时必填"
        />
      </UFormField>
    </div>

    <ContainerToolItem
      v-if="mode === 'encode'"
      label="JWT 加密（HS256）"
      content-class="flex flex-col gap-3"
    >
      <UFormField label="Header（JSON）">
        <UTextarea
          v-model="headerInput"
          class="w-full"
          :rows="6"
          resize
          placeholder="请输入 JWT Header JSON"
        />
      </UFormField>
      <UFormField label="Payload（JSON）">
        <UTextarea
          v-model="payloadInput"
          class="w-full"
          :rows="8"
          resize
          placeholder="请输入 JWT Payload JSON"
        />
      </UFormField>
      <div class="flex flex-wrap gap-2">
        <UButton label="加密生成" icon="i-lucide:lock" @click="encodeJwt" />
        <UButton label="清空" color="neutral" variant="soft" icon="i-lucide:eraser" @click="clearAll" />
      </div>
      <UTextarea
        :model-value="encodedToken"
        class="w-full"
        :rows="5"
        readonly
        resize
        placeholder="生成后的 JWT 会显示在这里"
      />
    </ContainerToolItem>

    <ContainerToolItem
      v-else
      label="JWT 解密"
      content-class="flex flex-col gap-3"
    >
      <UFormField label="JWT 字符串">
        <UTextarea
          v-model="tokenInput"
          class="w-full"
          :rows="6"
          resize
          placeholder="请输入 JWT"
        />
      </UFormField>
      <div class="flex flex-wrap gap-2">
        <UButton label="解密" icon="i-lucide:key-round" @click="decodeJwt" />
        <UButton label="清空" color="neutral" variant="soft" icon="i-lucide:eraser" @click="clearAll" />
      </div>
      <UFormField label="Header 明文">
        <UTextarea :model-value="decodedHeader" class="w-full" :rows="6" resize readonly />
      </UFormField>
      <UFormField label="Payload 明文">
        <UTextarea :model-value="decodedPayload" class="w-full" :rows="8" resize readonly />
      </UFormField>
    </ContainerToolItem>

    <UAlert
      v-if="errorMessage"
      color="error"
      icon="i-lucide:circle-alert"
      :title="errorMessage"
    />

    <UAlert
      v-if="statusMessage"
      :color="statusType"
      icon="i-lucide:info"
      :title="statusMessage"
    />
  </div>
</template>

<style scoped lang="scss">

</style>
