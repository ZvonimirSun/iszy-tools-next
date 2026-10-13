<script setup lang="ts">
import { parseSecretInput } from './children/input'
import { generateTotp } from './children/otp.service'

const input = ref('')
const mode = ref('auto')
const selected = ref(-1)
const now = ref(Date.now())
const mounted = ref(false)
const { copy } = useCopy()
const modes = [
  { label: '自动识别', value: 'auto' },
  { label: 'TOTP 数字验证码', value: 'totp' },
  { label: 'Steam 5 位验证码', value: 'steam' },
]
const parsed = computed(() => {
  try {
    return { candidates: parseSecretInput(input.value), error: '' }
  }
  catch (error) {
    return { candidates: [], error: error instanceof Error ? error.message : String(error) }
  }
})
watch(input, () => {
  selected.value = -1
}, { flush: 'sync' })
const candidate = computed(() => parsed.value.candidates.length === 1
  ? parsed.value.candidates[0]
  : parsed.value.candidates[selected.value])
const steam = computed(() => mode.value === 'steam' || (mode.value === 'auto' && candidate.value?.steam === true))
const period = computed(() => steam.value ? 30 : candidate.value?.period ?? 30)
const counter = computed(() => Math.floor(now.value / 1000 / period.value))
const remaining = computed(() => period.value - Math.floor(now.value / 1000) % period.value)
const signature = computed(() => JSON.stringify([candidate.value, steam.value, counter.value]))
const generated = computedAsync(async () => {
  const currentSignature = signature.value
  if (!mounted.value || !candidate.value) {
    return { token: '', error: '', signature: currentSignature }
  }
  try {
    const result = await generateTotp({ ...candidate.value, steam: steam.value, timestamp: counter.value * period.value * 1000 })
    return { token: result.token, error: '', signature: currentSignature }
  }
  catch (error) {
    return { token: '', error: error instanceof Error ? error.message : String(error), signature: currentSignature }
  }
}, { token: '', error: '', signature: '' })
const token = computed(() => generated.value.signature === signature.value ? generated.value.token : '')
const error = computed(() => parsed.value.error || (generated.value.signature === signature.value ? generated.value.error : ''))
const choices = computed(() => parsed.value.candidates.map((item, index) => ({
  label: `${item.label} · ${item.secret.slice(0, 4)}…${item.secret.slice(-4)}`,
  value: index,
})))

async function copyCode() {
  // Recompute at click time so a rollover or returning from a suspended tab cannot copy an expired code.
  if (candidate.value) {
    const result = await generateTotp({ ...candidate.value, steam: steam.value, timestamp: Date.now() })
    await copy(result.token)
    now.value = Date.now()
  }
}

let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  mounted.value = true
  now.value = Date.now()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 250)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <UAlert color="neutral" variant="soft" icon="i-lucide:shield-check" title="密钥和卡密仅在浏览器本地处理，不上传、不保存；粘贴的链接不会被访问。" />
    <UFormField label="密钥 / 2FA 链接 / 完整卡密" description="支持 Base32、otpauth://、steam://、带密钥的 2FA 链接，以及用 ----、竖线、空格或换行分隔的卡密。">
      <UTextarea
        v-model="input"
        class="w-full font-mono"
        :rows="5"
        placeholder="粘贴密钥，或 账号----密码----密钥----附加字段"
        autocomplete="off"
        :spellcheck="false"
      />
    </UFormField>
    <div class="flex flex-wrap items-end gap-3">
      <UFormField label="验证码类型" class="min-w-0 flex-1">
        <USelect v-model="mode" :items="modes" class="w-full" />
      </UFormField>
      <UButton color="neutral" variant="outline" icon="i-lucide:eraser" :disabled="!input" @click="input = ''">
        清空
      </UButton>
    </div>
    <p class="text-sm text-muted">
      普通密钥默认生成 6 位数字，每 30 秒刷新。otpauth 链接沿用其算法、位数和周期；Steam 密钥可手动选择 Steam 模式。
    </p>
    <UFormField v-if="choices.length > 1" label="发现多个候选密钥，请选择正确字段">
      <USelect v-model="selected" :items="choices" placeholder="选择密钥" class="w-full" />
    </UFormField>
    <UAlert v-if="error" color="error" variant="soft" :title="error" />
    <ContainerToolItem label="当前动态验证码">
      <div class="flex flex-col gap-4 p-6 text-center">
        <p class="text-sm text-muted">
          {{ candidate ? `${steam ? 'Steam · 5 位' : `TOTP · ${candidate.digits ?? 6} 位`} · ${period} 秒` : '粘贴密钥后自动生成' }}
        </p>
        <p class="select-all font-mono text-4xl font-semibold tracking-widest sm:text-5xl" aria-label="当前验证码">
          {{ token || '------' }}
        </p>
        <template v-if="token">
          <UProgress :model-value="remaining" :max="period" :color="remaining <= 5 ? 'warning' : 'primary'" />
          <p class="text-sm text-muted">
            {{ remaining }} 秒后自动刷新
          </p>
        </template>
        <UButton :disabled="!token" icon="i-lucide:copy" size="lg" class="justify-center" @click="copyCode">
          复制验证码
        </UButton>
      </div>
    </ContainerToolItem>
    <p class="text-sm text-muted">
      验证码依赖设备时间，请保持系统时间准确。无标签卡密按 Base32 字段识别；若识别不正确，请单独粘贴密钥。
    </p>
  </div>
</template>
