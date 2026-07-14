<script setup lang="ts">
import { generateMacAddresses } from './children/macGenerator.service'

const prefix = ref('AA:BB:CC')
const count = ref(10)
const uppercase = ref(true)
const separator = ref<':' | '-' | ''>(':')
const locallyAdministered = ref(false)
const refreshKey = ref(0)
const { copy } = useCopy()

const separatorOptions = [
  { label: '冒号 :', value: ':' },
  { label: '短横线 -', value: '-' },
  { label: '无分隔符', value: '' },
]

const generated = computed(() => {
  try {
    return {
      error: '',
      refreshKey: refreshKey.value,
      macs: generateMacAddresses({
        prefix: prefix.value,
        count: count.value,
        uppercase: uppercase.value,
        separator: separator.value,
        locallyAdministered: locallyAdministered.value,
      }),
    }
  }
  catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      refreshKey: refreshKey.value,
      macs: [],
    }
  }
})

const outputText = computed(() => generated.value.macs.join('\n'))

function refresh() {
  refreshKey.value += 1
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <div class="grid gap-3 md:grid-cols-3">
      <UFormField label="MAC 前缀">
        <UInput v-model="prefix" class="w-full font-mono" autofocus placeholder="AA:BB:CC" />
      </UFormField>
      <UFormField label="生成数量">
        <UInputNumber v-model="count" class="w-full" :min="1" :max="1000" />
      </UFormField>
      <UFormField label="分隔符">
        <USelect v-model="separator" :items="separatorOptions" class="w-full" />
      </UFormField>
    </div>

    <div class="flex flex-wrap items-center gap-4 rounded-lg border border-muted bg-muted/30 p-4">
      <USwitch v-model="uppercase" label="大写输出" />
      <USwitch v-model="locallyAdministered" label="无前缀时生成本地管理地址" />
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

    <ContainerToolItem label="MAC 地址">
      <div class="flex flex-col gap-2">
        <UTextarea
          :model-value="outputText"
          class="w-full font-mono"
          :rows="10"
          resize
          readonly
          placeholder="MAC 地址将显示在这里..."
        />
        <div class="flex justify-end">
          <UButton :disabled="!outputText" color="neutral" variant="outline" icon="i-lucide:copy" @click="copy(outputText)">
            复制全部
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>
