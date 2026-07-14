<script setup lang="ts">
import { convertIpv4 } from './children/ipv4Converter.service'

const input = ref('192.168.1.1')
const { copy } = useCopy()

const converted = computed(() => {
  try {
    return {
      error: '',
      rows: Object.entries(convertIpv4(input.value)).map(([label, value]) => ({
        label,
        value: String(value),
      })),
    }
  }
  catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      rows: [],
    }
  }
})

function fillExample() {
  input.value = '192.168.1.1'
}

function clear() {
  input.value = ''
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <div class="rounded-lg border border-muted bg-muted/30 p-4">
      <UFormField label="IPv4 地址 / 整数 / 十六进制 / 二进制">
        <UInput
          v-model="input"
          class="w-full font-mono"
          autofocus
          placeholder="192.168.1.1、3232235777、0xC0A80101..."
        />
      </UFormField>
      <div class="mt-3 flex flex-wrap gap-2">
        <UButton color="neutral" variant="outline" icon="i-lucide:file-input" @click="fillExample">
          示例
        </UButton>
        <UButton color="neutral" variant="outline" icon="i-lucide:trash-2" @click="clear">
          清空
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="converted.error"
      color="error"
      variant="soft"
      icon="i-lucide:circle-alert"
      :title="converted.error"
    />

    <div v-else class="rounded-lg border border-muted bg-muted/30 p-4">
      <div class="divide-y divide-muted">
        <div
          v-for="row in converted.rows"
          :key="row.label"
          class="grid items-center gap-3 py-2 first:pt-0 sm:grid-cols-[8rem_minmax(0,1fr)_2rem]"
        >
          <span class="text-sm font-medium text-muted sm:text-right">{{ row.label }}</span>
          <UInput :model-value="row.value" class="min-w-0 font-mono" readonly />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide:copy"
            size="sm"
            class="w-8 shrink-0"
            :aria-label="`复制 ${row.label}`"
            @click="copy(row.value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
