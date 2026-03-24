<script setup lang="ts">
import dayjs from 'dayjs'

type TimestampUnit = 'ms' | 's'

const timestampUnitOptions = [
  { label: '毫秒 (ms)', value: 'ms' },
  { label: '秒 (s)', value: 's' },
]

function toDateTimeInputValue(value: dayjs.Dayjs) {
  return value.format('YYYY-MM-DDTHH:mm:ss')
}

const timestampInput = ref(`${Date.now()}`)
const timestampUnit = ref<TimestampUnit>('ms')
const timestampToTimeResult = ref('')
const convertTimestampError = ref('')

const datetimeInput = ref(toDateTimeInputValue(dayjs()))
const timeToTimestampMs = ref('')
const timeToTimestampS = ref('')
const convertDatetimeError = ref('')

const baseDatetimeInput = ref(toDateTimeInputValue(dayjs()))
const offsetDays = ref(1)
const afterDaysResult = ref('')
const addDaysError = ref('')

const startDatetimeInput = ref(toDateTimeInputValue(dayjs()))
const endDatetimeInput = ref(toDateTimeInputValue(dayjs().add(1, 'day')))
const diffCalendarDays = ref<number | null>(null)
const diffExactDays = ref<number | null>(null)
const diffDaysError = ref('')

function parseDateTimeInput(input: string) {
  const value = dayjs(input)
  return value.isValid() ? value : null
}

function convertTimestampToTime() {
  convertTimestampError.value = ''
  timestampToTimeResult.value = ''

  const raw = timestampInput.value.trim()
  const num = Number(raw)
  if (!raw || !Number.isFinite(num)) {
    convertTimestampError.value = '请输入有效的时间戳数字'
    return
  }

  const ms = timestampUnit.value === 's' ? num * 1000 : num
  const parsed = dayjs(ms)

  if (!parsed.isValid()) {
    convertTimestampError.value = '时间戳超出可解析范围'
    return
  }

  timestampToTimeResult.value = `${parsed.format('YYYY-MM-DD HH:mm:ss')} (本地时间)`
  datetimeInput.value = toDateTimeInputValue(parsed)
}

function convertTimeToTimestamp() {
  convertDatetimeError.value = ''
  timeToTimestampMs.value = ''
  timeToTimestampS.value = ''

  const parsed = parseDateTimeInput(datetimeInput.value)
  if (!parsed) {
    convertDatetimeError.value = '请输入有效的日期时间'
    return
  }

  const ms = parsed.valueOf()
  timeToTimestampMs.value = `${ms}`
  timeToTimestampS.value = `${Math.floor(ms / 1000)}`
  timestampInput.value = `${ms}`
  timestampUnit.value = 'ms'
}

function calculateAfterDays() {
  addDaysError.value = ''
  afterDaysResult.value = ''

  const parsed = parseDateTimeInput(baseDatetimeInput.value)
  if (!parsed) {
    addDaysError.value = '请输入有效的基准日期时间'
    return
  }

  const next = parsed.add(offsetDays.value || 0, 'day')
  afterDaysResult.value = `${next.format('YYYY-MM-DD HH:mm:ss')} (本地时间)`
}

function calculateDateDiff() {
  diffDaysError.value = ''
  diffCalendarDays.value = null
  diffExactDays.value = null

  const start = parseDateTimeInput(startDatetimeInput.value)
  const end = parseDateTimeInput(endDatetimeInput.value)

  if (!start || !end) {
    diffDaysError.value = '请输入有效的开始时间和结束时间'
    return
  }

  diffCalendarDays.value = end.startOf('day').diff(start.startOf('day'), 'day')
  diffExactDays.value = Number((end.diff(start) / 86_400_000).toFixed(6))
}

onMounted(() => {
  convertTimestampToTime()
  convertTimeToTimestamp()
  calculateAfterDays()
  calculateDateDiff()
})
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <ContainerToolItem label="时间与时间戳互转" content-class="flex flex-col gap-4">
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="flex flex-col gap-3">
          <h3 class="text-sm text-toned">
            时间戳转时间
          </h3>
          <UForm class="flex flex-col gap-3">
            <UFormField label="时间戳" orientation="horizontal" class="grid grid-cols-[4rem_1fr]">
              <UInput v-model="timestampInput" placeholder="例如 1719830400000" class="w-full" />
            </UFormField>
            <UFormField label="单位" orientation="horizontal" class="grid grid-cols-[4rem_1fr]">
              <USelect v-model="timestampUnit" :items="timestampUnitOptions" class="w-full" />
            </UFormField>
            <div class="flex gap-2">
              <UButton label="转换" @click="convertTimestampToTime" />
            </div>
          </UForm>
          <UAlert
            v-if="convertTimestampError"
            color="error"
            icon="i-lucide:circle-alert"
            :title="convertTimestampError"
          />
          <UInput v-else :model-value="timestampToTimeResult" readonly class="w-full" />
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="text-sm text-toned">
            时间转时间戳
          </h3>
          <UForm class="flex flex-col gap-3">
            <UFormField label="时间" orientation="horizontal" class="grid grid-cols-[4rem_1fr]">
              <UInput v-model="datetimeInput" type="datetime-local" class="w-full" />
            </UFormField>
            <div class="flex gap-2">
              <UButton label="转换" @click="convertTimeToTimestamp" />
            </div>
          </UForm>
          <UAlert
            v-if="convertDatetimeError"
            color="error"
            icon="i-lucide:circle-alert"
            :title="convertDatetimeError"
          />
          <div v-else class="grid gap-2">
            <UInput :model-value="`毫秒: ${timeToTimestampMs}`" readonly class="w-full" />
            <UInput :model-value="`秒: ${timeToTimestampS}`" readonly class="w-full" />
          </div>
        </div>
      </div>
    </ContainerToolItem>

    <ContainerToolItem label="计算几天后的时间" content-class="flex flex-col gap-3">
      <UForm class="grid gap-3 md:grid-cols-2">
        <UFormField label="基准时间" orientation="horizontal" class="grid grid-cols-[4.5rem_1fr]">
          <UInput v-model="baseDatetimeInput" type="datetime-local" class="w-full" />
        </UFormField>
        <UFormField label="天数" orientation="horizontal" class="grid grid-cols-[4.5rem_1fr]">
          <UInputNumber v-model="offsetDays" :step="1" class="w-full" />
        </UFormField>
      </UForm>
      <div class="flex gap-2">
        <UButton label="计算" @click="calculateAfterDays" />
      </div>
      <UAlert
        v-if="addDaysError"
        color="error"
        icon="i-lucide:circle-alert"
        :title="addDaysError"
      />
      <UInput v-else :model-value="afterDaysResult" readonly class="w-full" />
    </ContainerToolItem>

    <ContainerToolItem label="计算两个日期相差天数" content-class="flex flex-col gap-3">
      <UForm class="grid gap-3 md:grid-cols-2">
        <UFormField label="开始时间" orientation="horizontal" class="grid grid-cols-[4.5rem_1fr]">
          <UInput v-model="startDatetimeInput" type="datetime-local" class="w-full" />
        </UFormField>
        <UFormField label="结束时间" orientation="horizontal" class="grid grid-cols-[4.5rem_1fr]">
          <UInput v-model="endDatetimeInput" type="datetime-local" class="w-full" />
        </UFormField>
      </UForm>
      <div class="flex gap-2">
        <UButton label="计算" @click="calculateDateDiff" />
      </div>
      <UAlert
        v-if="diffDaysError"
        color="error"
        icon="i-lucide:circle-alert"
        :title="diffDaysError"
      />
      <div v-else class="grid gap-2">
        <UInput :model-value="`自然日相差: ${diffCalendarDays ?? '-'} 天`" readonly class="w-full" />
        <UInput :model-value="`精确相差: ${diffExactDays ?? '-'} 天 (24h)`" readonly class="w-full" />
      </div>
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">

</style>
