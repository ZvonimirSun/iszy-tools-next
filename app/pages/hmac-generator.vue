<script setup lang="ts">
import CryptoJS from 'crypto-js'

type Algorithm = 'MD5' | 'RIPEMD160' | 'SHA1' | 'SHA224' | 'SHA256' | 'SHA384' | 'SHA512' | 'SHA3'
type OutputFormat = 'binary' | 'hex' | 'base64' | 'base64url'

const inputText = ref('')
const secret = ref('')
const algorithm = ref<Algorithm>('SHA256')
const outputFormat = ref<OutputFormat>('hex')
const { copy } = useCopy()

const algorithmItems = [
  { label: 'HMAC-MD5', value: 'MD5' },
  { label: 'HMAC-RIPEMD160', value: 'RIPEMD160' },
  { label: 'HMAC-SHA1', value: 'SHA1' },
  { label: 'HMAC-SHA224', value: 'SHA224' },
  { label: 'HMAC-SHA256', value: 'SHA256' },
  { label: 'HMAC-SHA384', value: 'SHA384' },
  { label: 'HMAC-SHA512', value: 'SHA512' },
  { label: 'HMAC-SHA3', value: 'SHA3' },
]

const outputFormatItems = [
  { label: 'Binary (base 2)', value: 'binary' },
  { label: 'Hexadecimal (base 16)', value: 'hex' },
  { label: 'Base64 (base 64)', value: 'base64' },
  { label: 'Base64-url (base 64 with url safe chars)', value: 'base64url' },
]

const result = computed(() => {
  if (!inputText.value || !secret.value)
    return ''

  const wordArray = getDigest(inputText.value, secret.value, algorithm.value)

  if (outputFormat.value === 'binary')
    return toBinaryString(wordArray)

  if (outputFormat.value === 'hex')
    return wordArray.toString(CryptoJS.enc.Hex)

  if (outputFormat.value === 'base64url')
    return CryptoJS.enc.Base64url.stringify(wordArray)

  return CryptoJS.enc.Base64.stringify(wordArray)
})

function getDigest(text: string, key: string, type: Algorithm) {
  switch (type) {
    case 'MD5':
      return CryptoJS.HmacMD5(text, key)
    case 'RIPEMD160':
      return CryptoJS.HmacRIPEMD160(text, key)
    case 'SHA1':
      return CryptoJS.HmacSHA1(text, key)
    case 'SHA224':
      return CryptoJS.HmacSHA224(text, key)
    case 'SHA384':
      return CryptoJS.HmacSHA384(text, key)
    case 'SHA512':
      return CryptoJS.HmacSHA512(text, key)
    case 'SHA3':
      return CryptoJS.HmacSHA3(text, key)
    case 'SHA256':
    default:
      return CryptoJS.HmacSHA256(text, key)
  }
}

function toBinaryString(wordArray: CryptoJS.lib.WordArray) {
  const bytes: string[] = []

  for (let i = 0; i < wordArray.sigBytes; i++) {
    const word = wordArray.words[i >>> 2]!
    const byte = (word >>> (24 - (i % 4) * 8)) & 0xFF
    bytes.push(byte.toString(2).padStart(8, '0'))
  }

  return bytes.join(' ')
}

function clear() {
  inputText.value = ''
  secret.value = ''
}
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex min-w-0 flex-col gap-2">
      <h2 class="text-base font-medium text-highlighted">
        待签名内容
      </h2>
      <UTextarea
        v-model="inputText"
        class="w-full font-mono"
        :rows="6"
        resize
        autofocus
        placeholder="输入需要生成 HMAC 的内容..."
      />
    </section>

    <UFormField label="密钥">
      <UInput v-model="secret" class="w-full font-mono" placeholder="输入 HMAC secret" />
    </UFormField>

    <div class="grid gap-3 md:grid-cols-2">
      <UFormField label="算法">
        <USelect v-model="algorithm" :items="algorithmItems" class="w-full" />
      </UFormField>
      <UFormField label="输出编码">
        <USelect v-model="outputFormat" :items="outputFormatItems" class="w-full" />
      </UFormField>
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton color="neutral" variant="outline" icon="i-lucide:trash-2" @click="clear">
        清空
      </UButton>
    </div>

    <section class="flex min-w-0 flex-col gap-2">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-medium text-highlighted">
          HMAC 结果
        </h2>
        <div class="flex gap-2">
          <UButton
            :disabled="!result"
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            size="sm"
            @click="copy(result)"
          >
            复制
          </UButton>
        </div>
      </div>
      <UTextarea
        :model-value="result"
        class="w-full font-mono"
        :rows="5"
        resize
        readonly
        placeholder="结果将显示在这里..."
      />
    </section>
  </div>
</template>
