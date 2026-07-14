<script setup lang="ts">
import { analyzePassword } from './children/passwordStrength.service'

const password = ref('')
const visible = ref(false)

const result = computed(() => analyzePassword(password.value))
const scorePercent = computed(() => `${(result.value.score + 1) * 20}%`)

function scoreColor(score: number) {
  if (score >= 4) {
    return 'success'
  }
  if (score >= 3) {
    return 'primary'
  }
  if (score >= 2) {
    return 'warning'
  }
  return 'error'
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <UAlert
      color="neutral"
      variant="soft"
      icon="i-lucide:shield-alert"
      title="仅在浏览器本地估算，结果用于排查明显弱密码，不代表绝对安全。"
    />

    <div class="rounded-lg border border-muted bg-muted/30 p-4">
      <UFormField label="待分析密码">
        <UInput
          v-model="password"
          class="w-full font-mono"
          :type="visible ? 'text' : 'password'"
          autofocus
          autocomplete="off"
          placeholder="输入密码..."
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="ghost"
              :icon="visible ? 'i-lucide:eye-off' : 'i-lucide:eye'"
              size="sm"
              :aria-label="visible ? '隐藏密码' : '显示密码'"
              @click="visible = !visible"
            />
          </template>
        </UInput>
      </UFormField>
    </div>

    <div class="rounded-lg border border-muted bg-muted/30 p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-sm text-muted">
            强度等级
          </p>
          <p class="text-2xl font-semibold">
            {{ result.label }}
          </p>
        </div>
        <UBadge :color="scoreColor(result.score)" variant="soft" size="lg">
          {{ Math.round(result.entropyBits) }} bits
        </UBadge>
      </div>
      <div class="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div class="h-full rounded-full bg-primary transition-all" :style="{ width: scorePercent }" />
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-3">
        <div class="rounded-md border border-muted p-3">
          <p class="text-xs text-muted">
            长度
          </p>
          <p class="text-lg font-semibold">
            {{ result.length }}
          </p>
        </div>
        <div class="rounded-md border border-muted p-3">
          <p class="text-xs text-muted">
            字符池
          </p>
          <p class="text-lg font-semibold">
            {{ result.poolSize }}
          </p>
        </div>
        <div class="rounded-md border border-muted p-3">
          <p class="text-xs text-muted">
            得分
          </p>
          <p class="text-lg font-semibold">
            {{ result.score }} / 4
          </p>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-muted bg-muted/30 p-4">
      <h2 class="mb-3 text-base font-semibold">
        估算破解时间
      </h2>
      <div class="divide-y divide-muted">
        <div
          v-for="item in result.crackTimes"
          :key="item.label"
          class="flex items-center justify-between gap-3 py-2 first:pt-0"
        >
          <span class="text-sm text-muted">{{ item.label }}</span>
          <span class="font-mono text-sm">{{ item.value }}</span>
        </div>
      </div>
    </div>

    <UAlert
      v-if="result.suggestions.length"
      color="warning"
      variant="soft"
      icon="i-lucide:list-checks"
      title="改进建议"
      :description="result.suggestions.join(' ')"
    />
  </div>
</template>
