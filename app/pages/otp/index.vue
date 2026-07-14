<script setup lang="ts">
import { createOtpAuthUri, generateBase32Secret, generateTotp, verifyTotp } from './children/otp.service'

const secret = ref('')
const issuer = ref('ISZY')
const account = ref('user@example.com')
const period = ref(30)
const digits = ref(6)
const algorithm = ref<'SHA-1' | 'SHA-256' | 'SHA-512'>('SHA-1')
const verificationCode = ref('')
const now = ref(Date.now())
const verifyResult = ref<boolean | null>(null)
const { copy } = useCopy()

let timer: ReturnType<typeof setInterval> | undefined

const digitOptions = [
  { label: '6 位', value: 6 },
  { label: '8 位', value: 8 },
]
const algorithmOptions = [
  { label: 'SHA-1', value: 'SHA-1' },
  { label: 'SHA-256', value: 'SHA-256' },
  { label: 'SHA-512', value: 'SHA-512' },
]

const generated = computedAsync(async () => {
  if (!secret.value.trim()) {
    return {
      error: '',
      token: '',
      remainingSeconds: 0,
    }
  }

  try {
    const result = await generateTotp({
      secret: secret.value,
      timestamp: now.value,
      period: period.value,
      digits: digits.value,
      algorithm: algorithm.value,
    })
    return {
      error: '',
      token: result.token,
      remainingSeconds: result.remainingSeconds,
    }
  }
  catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      token: '',
      remainingSeconds: 0,
    }
  }
}, { error: '', token: '', remainingSeconds: 0 })

const otpAuthUri = computed(() => {
  if (!secret.value.trim()) {
    return ''
  }

  return createOtpAuthUri({
    secret: secret.value,
    issuer: issuer.value,
    account: account.value,
    period: period.value,
    digits: digits.value,
    algorithm: algorithm.value,
  })
})

function refreshSecret() {
  secret.value = generateBase32Secret()
  verifyResult.value = null
}

async function verify() {
  if (!verificationCode.value) {
    verifyResult.value = null
    return
  }

  verifyResult.value = await verifyTotp(verificationCode.value, {
    secret: secret.value,
    timestamp: now.value,
    period: period.value,
    digits: digits.value,
    algorithm: algorithm.value,
    window: 1,
  })
}

onMounted(() => {
  refreshSecret()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
    <UAlert
      color="neutral"
      variant="soft"
      icon="i-lucide:shield-alert"
      title="Secret 和验证码仅在浏览器本地处理，不会上传或保存。"
    />

    <div class="grid gap-3 rounded-lg border border-muted bg-muted/30 p-4 md:grid-cols-[minmax(0,1fr)_auto]">
      <UFormField label="Base32 Secret">
        <UInput v-model="secret" class="w-full font-mono" placeholder="Base32 secret" />
      </UFormField>
      <UButton color="primary" icon="i-lucide:refresh-cw" class="self-end" @click="refreshSecret">
        生成 Secret
      </UButton>
    </div>

    <div class="grid gap-3 md:grid-cols-4">
      <UFormField label="Issuer">
        <UInput v-model="issuer" class="w-full" />
      </UFormField>
      <UFormField label="Account">
        <UInput v-model="account" class="w-full" />
      </UFormField>
      <UFormField label="位数">
        <USelect v-model="digits" :items="digitOptions" class="w-full" />
      </UFormField>
      <UFormField label="算法">
        <USelect v-model="algorithm" :items="algorithmOptions" class="w-full" />
      </UFormField>
    </div>

    <UAlert
      v-if="generated.error"
      color="error"
      variant="soft"
      icon="i-lucide:circle-alert"
      :title="generated.error"
    />

    <div class="grid gap-4 lg:grid-cols-2">
      <ContainerToolItem label="当前 TOTP">
        <div class="grid gap-3">
          <div class="rounded-lg border border-muted p-4 text-center">
            <p class="font-mono text-4xl font-semibold tracking-widest">
              {{ generated.token || '------' }}
            </p>
            <p class="mt-2 text-sm text-muted">
              剩余 {{ generated.remainingSeconds }} 秒
            </p>
          </div>
          <UButton
            :disabled="!generated.token"
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            @click="copy(generated.token)"
          >
            复制验证码
          </UButton>
        </div>
      </ContainerToolItem>

      <ContainerToolItem label="校验验证码">
        <div class="grid gap-3">
          <UInput v-model="verificationCode" class="w-full font-mono" placeholder="输入验证码..." />
          <UButton color="primary" icon="i-lucide:check" @click="verify">
            校验
          </UButton>
          <UAlert
            v-if="verifyResult !== null"
            :color="verifyResult ? 'success' : 'error'"
            variant="soft"
            :icon="verifyResult ? 'i-lucide:check-circle' : 'i-lucide:x-circle'"
            :title="verifyResult ? '验证码有效' : '验证码无效'"
          />
        </div>
      </ContainerToolItem>
    </div>

    <ContainerToolItem label="otpauth URI">
      <div class="grid gap-2">
        <UTextarea
          :model-value="otpAuthUri"
          class="w-full font-mono"
          :rows="3"
          resize
          readonly
          placeholder="otpauth URI 将显示在这里..."
        />
        <div class="flex justify-end">
          <UButton
            :disabled="!otpAuthUri"
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            @click="copy(otpAuthUri)"
          >
            复制 URI
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>
