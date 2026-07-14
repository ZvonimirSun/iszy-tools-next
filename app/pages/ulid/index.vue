<script setup lang="ts">
import { generateUlids } from './children/ulid.service'

const count = ref(10)
const lowercase = ref(false)
const fixedTimestamp = ref(false)
const timestampText = ref(new Date().toISOString())
const refreshKey = ref(0)
const { copy } = useCopy()

const timestamp = computed(() => {
  if (!fixedTimestamp.value) {
    return undefined
  }

  const value = Date.parse(timestampText.value)
  return Number.isNaN(value) ? null : value
})

const generated = computed(() => {
  if (timestamp.value === null) {
    return {
      error: '固定时间戳不是合法日期时间',
      ulids: [],
    }
  }

  return {
    error: '',
    refreshKey: refreshKey.value,
    ulids: generateUlids({
      count: count.value,
      lowercase: lowercase.value,
      timestamp: timestamp.value,
    }),
  }
})

const outputText = computed(() => generated.value.ulids.join('\n'))

function refresh() {
  refreshKey.value += 1
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <div class="grid gap-3 md:grid-cols-2">
      <UFormField label="生成数量">
        <UInputNumber v-model="count" class="w-full" :min="1" :max="1000" />
      </UFormField>
      <UFormField label="输出格式">
        <USwitch v-model="lowercase" label="小写输出" class="pt-2" />
      </UFormField>
    </div>

    <div class="grid gap-3 rounded-lg border border-muted bg-muted/30 p-4 md:grid-cols-[12rem_minmax(0,1fr)]">
      <USwitch v-model="fixedTimestamp" label="使用固定时间戳" />
      <UInput
        v-model="timestampText"
        class="w-full font-mono"
        :disabled="!fixedTimestamp"
        placeholder="2026-07-14T00:00:00.000Z"
      />
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton color="primary" icon="i-lucide:refresh-cw" @click="refresh">
        重新生成
      </UButton>
    </div>

    <UAlert
      v-if="generated.error"
      color="error"
      variant="soft"
      icon="i-lucide:circle-alert"
      :title="generated.error"
    />

    <ContainerToolItem label="ULID 结果">
      <div class="flex flex-col gap-2">
        <UTextarea
          :model-value="outputText"
          class="w-full font-mono"
          :rows="10"
          resize
          readonly
          placeholder="ULID 将显示在这里..."
        />
        <div class="flex justify-end">
          <UButton
            :disabled="!outputText"
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            @click="copy(outputText)"
          >
            复制全部
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>
