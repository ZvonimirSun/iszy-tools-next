<script setup lang="ts">
type OutputMode = 'lines' | 'comma'

const { copy } = useCopy()

const formState = reactive({
  min: 0,
  max: 100,
  count: 5,
  precision: 0,
  includeMin: true,
  includeMax: true,
  outputMode: 'lines' as OutputMode,
})

const result = ref('')
const errorMessage = ref('')

const outputModeOptions = [
  { label: '逐行输出', value: 'lines' },
  { label: '逗号分隔', value: 'comma' },
]

function normalizeConfig() {
  errorMessage.value = ''

  if (!Number.isFinite(formState.min) || !Number.isFinite(formState.max)) {
    errorMessage.value = '最小值和最大值必须是有效数字'
    return null
  }

  if (!Number.isFinite(formState.count) || formState.count < 1) {
    errorMessage.value = '生成数量必须大于等于 1'
    return null
  }

  formState.count = Math.min(1000, Math.max(1, Math.trunc(formState.count)))

  if (!Number.isFinite(formState.precision)) {
    errorMessage.value = '小数位数必须是有效数字'
    return null
  }
  formState.precision = Math.min(12, Math.max(0, Math.trunc(formState.precision)))

  if (formState.min > formState.max) {
    const temp = formState.min
    formState.min = formState.max
    formState.max = temp
  }

  return {
    min: formState.min,
    max: formState.max,
    count: formState.count,
    precision: formState.precision,
    includeMin: formState.includeMin,
    includeMax: formState.includeMax,
    outputMode: formState.outputMode,
  }
}

function resolveIntegerBounds(min: number, max: number, includeMin: boolean, includeMax: boolean) {
  const low = includeMin ? Math.ceil(min) : Math.floor(min) + 1
  const high = includeMax ? Math.floor(max) : Math.ceil(max) - 1
  return { low, high }
}

function randomFloatByRange(min: number, max: number, includeMin: boolean, includeMax: boolean) {
  const span = max - min

  if (span === 0)
    return min

  if (includeMin)
    return includeMax ? min + Math.random() * span : min + Math.random() * span

  if (includeMax)
    return max - Math.random() * span

  let value = min + Math.random() * span
  while (value <= min || value >= max) {
    value = min + Math.random() * span
  }
  return value
}

function formatOutput(values: string[], outputMode: OutputMode) {
  return outputMode === 'comma' ? values.join(', ') : values.join('\n')
}

function generateRandomNumbers() {
  result.value = ''
  const config = normalizeConfig()
  if (!config)
    return

  const { min, max, count, precision, includeMin, includeMax, outputMode } = config
  const generateDecimal = precision > 0

  if (!generateDecimal) {
    const bounds = resolveIntegerBounds(min, max, includeMin, includeMax)
    if (bounds.low > bounds.high) {
      errorMessage.value = '当前区间与整数模式无可用值，请调整最小值、最大值或包含设置'
      return
    }

    const values: string[] = []
    const size = bounds.high - bounds.low + 1
    for (let i = 0; i < count; i++) {
      const value = Math.floor(Math.random() * size) + bounds.low
      values.push(`${value}`)
    }

    result.value = formatOutput(values, outputMode)
    return
  }

  if (min === max && (!includeMin || !includeMax)) {
    errorMessage.value = '最小值与最大值相等时，只有同时包含最小值和最大值才可生成结果'
    return
  }

  const values: string[] = []
  for (let i = 0; i < count; i++) {
    const value = randomFloatByRange(min, max, includeMin, includeMax)
    values.push(value.toFixed(precision))
  }

  result.value = formatOutput(values, outputMode)
}

function clearAll() {
  result.value = ''
  errorMessage.value = ''
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <ContainerToolItem label="随机数配置" content-class="flex flex-col gap-4">
      <UForm class="grid gap-3 md:grid-cols-2">
        <UFormField label="最小值">
          <UInputNumber
            v-model="formState.min"
            class="w-full"
            orientation="vertical"
            :step="formState.precision > 0 ? (1 / 10 ** Math.min(formState.precision, 6)) : 1"
            :step-strictly="formState.precision === 0"
          />
          <div class="mt-2 flex items-center gap-2 text-sm text-toned">
            <span>包含最小值</span>
            <USwitch v-model="formState.includeMin" />
          </div>
        </UFormField>

        <UFormField label="最大值">
          <UInputNumber
            v-model="formState.max"
            class="w-full"
            orientation="vertical"
            :step="formState.precision > 0 ? (1 / 10 ** Math.min(formState.precision, 6)) : 1"
            :step-strictly="formState.precision === 0"
          />
          <div class="mt-2 flex items-center gap-2 text-sm text-toned">
            <span>包含最大值</span>
            <USwitch v-model="formState.includeMax" />
          </div>
        </UFormField>

        <UFormField label="生成数量">
          <UInputNumber
            v-model="formState.count"
            class="w-full"
            orientation="vertical"
            :min="1"
            :max="1000"
            :step="1"
            :step-strictly="true"
          />
        </UFormField>

        <UFormField label="小数位数">
          <UInputNumber
            v-model="formState.precision"
            class="w-full"
            orientation="vertical"
            :min="0"
            :max="12"
            :step="1"
            :step-strictly="true"
          />
        </UFormField>

        <UFormField label="输出格式" class="md:col-span-2">
          <USelect v-model="formState.outputMode" :items="outputModeOptions" class="w-full" />
        </UFormField>
      </UForm>
    </ContainerToolItem>

    <div class="flex flex-wrap gap-2">
      <UButton color="primary" icon="i-lucide:dice-5" @click="generateRandomNumbers">
        生成
      </UButton>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide:copy"
        :disabled="!result"
        @click="copy(result)"
      >
        复制结果
      </UButton>
      <UButton color="neutral" variant="outline" icon="i-lucide:trash-2" @click="clearAll">
        清空结果
      </UButton>
    </div>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      icon="i-lucide:circle-alert"
      :title="errorMessage"
    />

    <ContainerToolItem label="生成结果">
      <UTextarea
        :model-value="result"
        class="w-full"
        :rows="10"
        :maxrows="20"
        readonly
        placeholder="点击“生成”后在此显示随机数结果"
      />
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">

</style>
