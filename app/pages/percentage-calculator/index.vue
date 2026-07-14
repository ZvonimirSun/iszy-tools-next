<script setup lang="ts">
import { formatPercentValue, percentageOf, percentChange, percentRatio } from './children/percentageCalculator.service'

const value = ref(200)
const percent = ref(15)
const part = ref(25)
const total = ref(200)
const from = ref(100)
const to = ref(125)

const percentOfResult = computed(() => formatPercentValue(percentageOf(value.value, percent.value)))
const ratioResult = computed(() => {
  try {
    return `${formatPercentValue(percentRatio(part.value, total.value))}%`
  }
  catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
})
const changeResult = computed(() => {
  try {
    const value = percentChange(from.value, to.value)
    return `${value >= 0 ? '+' : ''}${formatPercentValue(value)}%`
  }
  catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
})
</script>

<template>
  <div class="mx-auto grid w-full max-w-4xl gap-4 lg:grid-cols-3">
    <section class="rounded-lg border border-muted bg-muted/30 p-4">
      <h2 class="mb-4 text-base font-semibold">
        计算百分比值
      </h2>
      <div class="grid gap-3">
        <UFormField label="数值">
          <UInputNumber v-model="value" class="w-full" />
        </UFormField>
        <UFormField label="百分比">
          <UInputNumber v-model="percent" class="w-full" />
        </UFormField>
        <UInput :model-value="percentOfResult" class="font-mono" readonly />
      </div>
    </section>

    <section class="rounded-lg border border-muted bg-muted/30 p-4">
      <h2 class="mb-4 text-base font-semibold">
        计算占比
      </h2>
      <div class="grid gap-3">
        <UFormField label="部分">
          <UInputNumber v-model="part" class="w-full" />
        </UFormField>
        <UFormField label="总数">
          <UInputNumber v-model="total" class="w-full" />
        </UFormField>
        <UInput :model-value="ratioResult" class="font-mono" readonly />
      </div>
    </section>

    <section class="rounded-lg border border-muted bg-muted/30 p-4">
      <h2 class="mb-4 text-base font-semibold">
        计算变化率
      </h2>
      <div class="grid gap-3">
        <UFormField label="起始值">
          <UInputNumber v-model="from" class="w-full" />
        </UFormField>
        <UFormField label="结束值">
          <UInputNumber v-model="to" class="w-full" />
        </UFormField>
        <UInput :model-value="changeResult" class="font-mono" readonly />
      </div>
    </section>
  </div>
</template>
