import type { LoanEventDisplayItem, LoanOptions, TotalData } from './mtqLoans.types'
import dayjs from 'dayjs'
import { EVENT_TIMELINE_ORDER_INVALID_MESSAGE } from './mtqLoans.magicconst'
import { buildSchedule, calcLoanSummary, createLoanOptionsFromData, validateLoanData } from './mtqLoans.service'

function getDefaultData(): TotalData {
  return {
    loanAmount: 150000,
    repaymentPeriod: 2,
    loanMonth: 24,
    lendingRates: 4.5,
    repayment: 'equalLoan',
    interestStartDate: dayjs().format('YYYY-MM-DD'),
    firstRepaymentDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
    prepayment: [],
    rateAdjustments: [],
  }
}

export function useMtqLoans() {
  const data = reactive<TotalData>(getDefaultData())
  const eventDisplayList = ref<LoanEventDisplayItem[]>([])

  const repaymentPeriodItems = [
    { label: '自定义贷款期限', value: 0 },
    ...Array.from({ length: 30 }).map((_, index) => {
      const years = index + 1
      return {
        label: `${years}年(${years * 12}月)`,
        value: years,
      }
    }),
  ]

  const repaymentTypeItems = [
    { label: '等额本息', value: 'equalLoan' },
    { label: '等额本金', value: 'equalPrincipal' },
  ]

  watch(() => data.repaymentPeriod, (val) => {
    if (val > 0) {
      data.loanMonth = val * 12
      return
    }
    if (!Number.isInteger(data.loanMonth) || data.loanMonth <= 0) {
      data.loanMonth = 120
    }
  })

  function createCalculationData(): TotalData {
    const chronologicalEvents = [...eventDisplayList.value].reverse()

    return {
      ...data,
      prepayment: chronologicalEvents
        .filter((event): event is Extract<LoanEventDisplayItem, { kind: 'prepayment' }> => event.kind === 'prepayment')
        .map(event => event.item),
      rateAdjustments: chronologicalEvents
        .filter((event): event is Extract<LoanEventDisplayItem, { kind: 'rateAdjustment' }> => event.kind === 'rateAdjustment')
        .map(event => event.item),
    }
  }

  function validateEventTimeline() {
    const startDate = dayjs(data.interestStartDate)
    if (!startDate.isValid()) {
      return ''
    }

    let previousDate = startDate
    for (const event of [...eventDisplayList.value].reverse()) {
      const currentDate = dayjs(event.item.repaymentDate)
      if (!currentDate.isValid() || currentDate.isBefore(previousDate, 'day')) {
        return EVENT_TIMELINE_ORDER_INVALID_MESSAGE
      }
      previousDate = currentDate
    }

    return ''
  }

  const calculationData = computed<TotalData>(() => createCalculationData())

  const validationMessage = computed(() => validateEventTimeline() || validateLoanData(calculationData.value))

  const loanOptions = computed<LoanOptions | null>(() => {
    if (validationMessage.value) {
      return null
    }

    return createLoanOptionsFromData(calculationData.value)
  })

  function getLatestEventDate() {
    return eventDisplayList.value[0]?.item.repaymentDate || data.interestStartDate
  }

  const originDataSource = computed(() => {
    if (!loanOptions.value) {
      return []
    }
    return buildSchedule({ ...loanOptions.value, prepayment: [], rateAdjustments: [] }, false)
  })

  const dataSource = computed(() => {
    if (!loanOptions.value) {
      return []
    }
    return buildSchedule(loanOptions.value, true)
  })

  const summary = computed(() => {
    if (!loanOptions.value) {
      return null
    }
    return calcLoanSummary(loanOptions.value, originDataSource.value, dataSource.value)
  })

  function addPrepayment() {
    const defaultDate = getLatestEventDate()

    eventDisplayList.value.unshift({
      kind: 'prepayment',
      item: {
        repaymentDate: defaultDate,
        repaymentAmount: 0,
        adjustLoanMonth: 0,
        extraCharge: undefined,
      },
    })
  }

  function addRateAdjustment() {
    const defaultDate = getLatestEventDate()

    eventDisplayList.value.unshift({
      kind: 'rateAdjustment',
      item: {
        repaymentDate: defaultDate,
        lendingRates: data.lendingRates,
      },
    })
  }

  function removeEventAt(index: number) {
    eventDisplayList.value.splice(index, 1)
  }

  return {
    data,
    repaymentPeriodItems,
    repaymentTypeItems,
    validationMessage,
    eventDisplayList,
    dataSource,
    summary,
    addPrepayment,
    addRateAdjustment,
    removeEventAt,
    reset: () => {
      Object.assign(data, getDefaultData())
      eventDisplayList.value = []
    },
  }
}
