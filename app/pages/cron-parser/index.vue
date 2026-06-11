<script setup lang="ts">
import { Cron } from 'croner'
import cronstrue from 'cronstrue/i18n.js'

type FieldKey = 'minute' | 'hour' | 'day' | 'month' | 'weekday'

interface CronField {
  key: FieldKey
  label: string
  range: string
}

const { copy } = useCopy()

const expression = ref('5 4 * * *')
const activeField = ref<FieldKey>('minute')

const cronFields: CronField[] = [
  { key: 'minute', label: '分钟', range: '0-59' },
  { key: 'hour', label: '小时', range: '0-23' },
  { key: 'day', label: '日期', range: '1-31' },
  { key: 'month', label: '月份', range: '1-12 或 JAN-DEC' },
  { key: 'weekday', label: '星期', range: '0-7 或 SUN-SAT' },
]

const macroItems = [
  { label: '@yearly / @annually', value: '0 0 1 1 *' },
  { label: '@monthly', value: '0 0 1 * *' },
  { label: '@weekly', value: '0 0 * * 0' },
  { label: '@daily / @midnight', value: '0 0 * * *' },
  { label: '@hourly', value: '0 * * * *' },
]

const fieldRuleRows = [
  { symbol: '*', description: '任意值' },
  { symbol: ',', description: '多个值分隔' },
  { symbol: '-', description: '范围' },
  { symbol: '/', description: '步长' },
]

const fieldSpecificRows: Record<FieldKey, Array<{ symbol: string, description: string }>> = {
  minute: [{ symbol: '0-59', description: '允许值' }],
  hour: [{ symbol: '0-23', description: '允许值' }],
  day: [{ symbol: '1-31', description: '允许值' }],
  month: [
    { symbol: '1-12', description: '允许值' },
    { symbol: 'JAN-DEC', description: '月份别名' },
  ],
  weekday: [
    { symbol: '0-7', description: '允许值，0 和 7 都表示周日' },
    { symbol: 'SUN-SAT', description: '星期别名' },
  ],
}

const normalizedExpression = computed(() => expression.value.trim().replace(/\s+/g, ' '))
const fieldValues = computed(() => expandMacro(normalizedExpression.value).split(' '))
const activeFieldIndex = computed(() => cronFields.findIndex(field => field.key === activeField.value))
const activeFieldInfo = computed(() => cronFields.find(field => field.key === activeField.value) ?? cronFields[0]!)
const activeFieldValue = computed(() => fieldValues.value[activeFieldIndex.value] ?? '')
const activeFieldRows = computed(() => [
  ...fieldRuleRows,
  ...fieldSpecificRows[activeField.value],
])

const parseResult = computed(() => {
  const value = normalizedExpression.value
  if (!value) {
    return {
      valid: false,
      description: '请输入 Cron 表达式',
      nextRuns: [],
    }
  }

  try {
    const description = cronstrue.toString(value, {
      locale: 'zh_CN',
      throwExceptionOnParseError: true,
      use24HourTimeFormat: true,
    })
    const cron = new Cron(value)
    const nextRuns = cron.nextRuns(5).map(date => formatDate(date))
    return {
      valid: true,
      description,
      nextRuns,
    }
  }
  catch (error) {
    return {
      valid: false,
      description: getErrorMessage(error),
      nextRuns: [],
    }
  }
})

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function expandMacro(value: string) {
  const lowerValue = value.toLowerCase()
  const matched = macroItems.find(item => item.label.toLowerCase().split(' / ').includes(lowerValue))
  return matched?.value ?? value
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

function useMacro(value: string) {
  expression.value = value
}
</script>

<template>
  <div class="flex w-full flex-col gap-3">
    <section class="rounded-lg border border-muted bg-muted/20 p-3">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-medium text-highlighted">
              Cron 表达式
            </h2>
            <UButton
              :disabled="!normalizedExpression"
              color="neutral"
              variant="outline"
              icon="i-lucide:copy"
              size="sm"
              @click="copy(normalizedExpression)"
            >
              复制
            </UButton>
          </div>
          <UInput
            v-model="expression"
            class="w-full font-mono"
            size="xl"
            placeholder="5 4 * * *"
            autofocus
          />
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="item in macroItems"
              :key="item.label"
              color="neutral"
              variant="soft"
              size="sm"
              @click="useMacro(item.value)"
            >
              {{ item.label }}
            </UButton>
          </div>
        </div>

        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-sm text-muted">
                解析结果
              </div>
              <div
                class="mt-1 text-xl font-semibold text-highlighted"
                :class="{ 'text-error': !parseResult.valid }"
              >
                {{ parseResult.valid ? `“${parseResult.description}”` : parseResult.description }}
              </div>
            </div>
          </div>

          <div v-if="parseResult.nextRuns.length" class="grid gap-2 sm:grid-cols-2">
            <div
              v-for="(item, index) in parseResult.nextRuns"
              :key="item"
              class="rounded-md border border-muted bg-default px-3 py-2"
            >
              <div class="text-xs text-muted">
                {{ index === 0 ? '下一次' : `第 ${index + 1} 次` }}
              </div>
              <div class="font-mono text-sm text-highlighted">
                {{ item }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-lg border border-muted bg-muted/20 p-3">
      <div class="grid gap-3 lg:grid-cols-4">
        <div class="flex min-w-0 flex-col gap-3 lg:col-span-3">
          <div class="grid grid-cols-5 overflow-hidden rounded-md border border-muted">
            <button
              v-for="(field, index) in cronFields"
              :key="field.key"
              type="button"
              class="min-w-0 border-r border-muted px-2 py-2 text-center text-sm last:border-r-0"
              :class="activeField === field.key ? 'bg-primary/10 text-primary' : 'bg-default text-muted hover:bg-muted/40'"
              @click="activeField = field.key"
            >
              <div class="font-medium">
                {{ field.label }}
              </div>
              <div class="truncate font-mono text-base text-highlighted">
                {{ fieldValues[index] ?? '-' }}
              </div>
            </button>
          </div>

          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-md border border-muted bg-default p-3">
              <div class="text-xs text-muted">
                当前字段
              </div>
              <div class="mt-1 text-sm text-highlighted">
                {{ activeFieldInfo.label }}：<span class="font-mono">{{ activeFieldValue || '-' }}</span>
              </div>
            </div>
            <div class="rounded-md border border-muted bg-default p-3">
              <div class="text-xs text-muted">
                允许范围
              </div>
              <div class="mt-1 text-sm text-highlighted">
                {{ activeFieldInfo.range }}
              </div>
            </div>
          </div>
        </div>

        <div class="overflow-hidden rounded-md border border-muted bg-default">
          <div
            v-for="row in activeFieldRows"
            :key="`${activeField}-${row.symbol}`"
            class="flex gap-3 border-b border-muted px-3 py-2 text-sm last:border-b-0"
          >
            <div class="w-20 shrink-0 font-mono text-highlighted">
              {{ row.symbol }}
            </div>
            <div class="text-muted">
              {{ row.description }}
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
