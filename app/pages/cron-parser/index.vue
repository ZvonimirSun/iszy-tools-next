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
  { symbol: ',', description: '列举多个值' },
  { symbol: '-', description: '连续范围' },
  { symbol: '/', description: '步长' },
]

const symbolRows = [
  { symbol: '*', meaning: '任意值', example: '* * * * *', equivalent: '每分钟' },
  { symbol: '-', meaning: '连续范围', example: '1-10 * * * *', equivalent: '第 1 到 10 分钟' },
  { symbol: ',', meaning: '列举多个值', example: '1,10 * * * *', equivalent: '在第 1 和 10 分钟' },
  { symbol: '/', meaning: '步长', example: '*/10 * * * *', equivalent: '每 10 分钟' },
  { symbol: '@yearly', meaning: '每年 1 月 1 日 0 点执行一次', example: '@yearly', equivalent: '0 0 1 1 *' },
  { symbol: '@annually', meaning: '与 @yearly 相同', example: '@annually', equivalent: '0 0 1 1 *' },
  { symbol: '@monthly', meaning: '每月 1 日 0 点执行一次', example: '@monthly', equivalent: '0 0 1 * *' },
  { symbol: '@weekly', meaning: '每周日 0 点执行一次', example: '@weekly', equivalent: '0 0 * * 0' },
  { symbol: '@daily', meaning: '每天 0 点执行一次', example: '@daily', equivalent: '0 0 * * *' },
  { symbol: '@midnight', meaning: '与 @daily 相同', example: '@midnight', equivalent: '0 0 * * *' },
  { symbol: '@hourly', meaning: '每小时整点执行一次', example: '@hourly', equivalent: '0 * * * *' },
  { symbol: '@reboot', meaning: '系统启动时执行', example: '@reboot', equivalent: '' },
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

const cronFormatDiagram = `┌──────────── [optional] seconds (0 - 59)
| ┌────────── minute (0 - 59)
| | ┌──────── hour (0 - 23)
| | | ┌────── day of month (1 - 31)
| | | | ┌──── month (1 - 12) OR jan,feb,mar,apr ...
| | | | | ┌── day of week (0 - 6, sunday=0) OR sun,mon ...
| | | | | |
* * * * * * command`

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

    <section class="rounded-lg border border-muted bg-muted/20 p-3">
      <h2 class="text-base font-medium text-highlighted">
        字段说明
      </h2>
      <pre class="mt-3 overflow-auto rounded-md border border-muted bg-default p-3 font-mono text-xs leading-5 text-highlighted sm:text-sm">{{ cronFormatDiagram }}</pre>
      <div class="mt-3 overflow-auto rounded-md border border-muted bg-default">
        <div class="min-w-[36rem]">
          <div class="grid grid-cols-[7.5rem_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)] gap-3 border-b border-muted px-3 py-2 text-sm font-medium text-muted">
            <span>符号</span>
            <span>含义</span>
            <span>示例</span>
            <span>等价表达式</span>
          </div>
          <div
            v-for="row in symbolRows"
            :key="row.symbol"
            class="grid grid-cols-[7.5rem_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)] gap-3 border-b border-muted px-3 py-2 text-sm last:border-b-0"
          >
            <span class="font-mono text-highlighted">{{ row.symbol }}</span>
            <span class="text-muted">{{ row.meaning }}</span>
            <span class="font-mono text-highlighted">{{ row.example }}</span>
            <span class="font-mono text-highlighted">{{ row.equivalent || '—' }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
