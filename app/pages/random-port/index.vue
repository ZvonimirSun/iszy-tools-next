<script setup lang="ts">
import { generateRandomPorts } from './children/randomPort.service'

const min = ref(1024)
const max = ref(65535)
const count = ref(10)
const unique = ref(true)
const refreshKey = ref(0)
const { copy } = useCopy()

const generated = computed(() => {
  try {
    return {
      error: '',
      refreshKey: refreshKey.value,
      ports: generateRandomPorts({
        min: min.value,
        max: max.value,
        count: count.value,
        unique: unique.value,
      }),
    }
  }
  catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      refreshKey: refreshKey.value,
      ports: [],
    }
  }
})

const outputText = computed(() => generated.value.ports.join('\n'))

function refresh() {
  refreshKey.value += 1
}

function useDevRange() {
  min.value = 3000
  max.value = 9999
  count.value = 10
  unique.value = true
  refresh()
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <div class="grid gap-3 md:grid-cols-3">
      <UFormField label="最小端口">
        <UInputNumber v-model="min" class="w-full" :min="0" :max="65535" />
      </UFormField>
      <UFormField label="最大端口">
        <UInputNumber v-model="max" class="w-full" :min="0" :max="65535" />
      </UFormField>
      <UFormField label="数量">
        <UInputNumber v-model="count" class="w-full" :min="1" :max="1000" />
      </UFormField>
    </div>

    <div class="flex flex-wrap items-center gap-3 rounded-lg border border-muted bg-muted/30 p-4">
      <USwitch v-model="unique" label="端口不重复" />
      <UButton color="neutral" variant="outline" icon="i-lucide:server" @click="useDevRange">
        开发端口范围
      </UButton>
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

    <ContainerToolItem label="随机端口">
      <div class="flex flex-col gap-2">
        <UTextarea
          :model-value="outputText"
          class="w-full font-mono"
          :rows="10"
          resize
          readonly
          placeholder="随机端口将显示在这里..."
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
