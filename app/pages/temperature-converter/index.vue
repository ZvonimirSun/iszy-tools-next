<script setup lang="ts">
import { convertTemperature, temperatureUnits } from './children/temperatureConverter.service'
import type { TemperatureUnit } from './children/temperatureConverter.service'

const inputValue = ref(25)
const inputUnit = ref<TemperatureUnit>('celsius')
const { copy } = useCopy()

const rows = computed(() => convertTemperature(inputValue.value, inputUnit.value))
const outputText = computed(() => rows.value.map(row => `${row.label}: ${format(row.value)}`).join('\n'))

function format(value: number) {
  return Number(value.toFixed(4)).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <div class="grid gap-3 rounded-lg border border-muted bg-muted/30 p-4 md:grid-cols-2">
      <UFormField label="温度值">
        <UInputNumber v-model="inputValue" class="w-full" />
      </UFormField>
      <UFormField label="输入温标">
        <USelect v-model="inputUnit" :items="temperatureUnits.map(item => ({ label: item.label, value: item.unit }))" class="w-full" />
      </UFormField>
    </div>

    <div class="rounded-lg border border-muted bg-muted/30 p-4">
      <div class="divide-y divide-muted">
        <div
          v-for="row in rows"
          :key="row.unit"
          class="grid items-center gap-3 py-2 first:pt-0 sm:grid-cols-[10rem_minmax(0,1fr)_2rem]"
        >
          <span class="text-sm font-medium text-muted sm:text-right">{{ row.label }}</span>
          <UInput :model-value="format(row.value)" class="font-mono" readonly />
          <UButton color="neutral" variant="ghost" icon="i-lucide:copy" size="sm" class="w-8" @click="copy(format(row.value))" />
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <UButton color="neutral" variant="outline" icon="i-lucide:copy" @click="copy(outputText)">
        复制全部
      </UButton>
    </div>
  </div>
</template>
