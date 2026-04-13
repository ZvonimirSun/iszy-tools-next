<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import dayjs from 'dayjs'

type DateInput = number | string | Date
type DateModelValue = DateInput | null
type DateOutput = Date | string
type InnerValue = null | CalendarDate

interface DatePickerProps {
  valueFormat?: string
  min?: DateInput
  max?: DateInput
}

const props = withDefaults(defineProps<DatePickerProps>(), {
  valueFormat: undefined,
  min: undefined,
  max: undefined,
})

const modelValue = defineModel<DateModelValue>()
const inputDate = useTemplateRef<{ inputsRef?: Array<{ $el?: Element }> }>('inputDate')

function toDate(value: DateInput): Date | null {
  const parsed = dayjs(value)
  if (!parsed.isValid()) {
    return null
  }
  return parsed.toDate()
}

function toCalendarDate(value: DateInput): CalendarDate | null {
  const date = toDate(value)
  if (!date) {
    return null
  }
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

function dateValueToDate(value: CalendarDate): Date {
  return new Date(value.year, value.month - 1, value.day)
}

function serializeOutput(date: Date): DateOutput {
  if (props.valueFormat) {
    return dayjs(date).format(props.valueFormat)
  }
  return date
}

function clampDate(date: Date): Date {
  const current = dayjs(date).startOf('day')
  const minDate = props.min != null ? toDate(props.min) : null
  const maxDate = props.max != null ? toDate(props.max) : null

  if (minDate && current.isBefore(dayjs(minDate), 'day')) {
    return minDate
  }
  if (maxDate && current.isAfter(dayjs(maxDate), 'day')) {
    return maxDate
  }

  return date
}

const minCalendarDate = computed<CalendarDate | undefined>(() => {
  return props.min ? toCalendarDate(props.min) ?? undefined : undefined
})

const maxCalendarDate = computed<CalendarDate | undefined>(() => {
  return props.max ? toCalendarDate(props.max) ?? undefined : undefined
})

const innerValue = computed<InnerValue>({
  get: () => {
    const current = modelValue.value

    if (current == null) {
      return null
    }

    return toCalendarDate(current)
  },
  set: (value) => {
    if (!value) {
      modelValue.value = null
      return
    }

    modelValue.value = serializeOutput(clampDate(dateValueToDate(value)))
  },
})
</script>

<template>
  <UInputDate
    ref="inputDate"
    v-model="innerValue"
    :min-value="minCalendarDate"
    :max-value="maxCalendarDate"
  >
    <template #trailing>
      <UPopover :reference="inputDate?.inputsRef?.[3]?.$el">
        <UButton
          color="neutral"
          variant="link"
          size="sm"
          icon="i-lucide-calendar"
          aria-label="选择日期"
          class="px-0"
        />

        <template #content>
          <UCalendar
            v-model="innerValue"
            :min-value="minCalendarDate"
            :max-value="maxCalendarDate"
            class="p-2"
          />
        </template>
      </UPopover>
    </template>
  </UInputDate>
</template>
