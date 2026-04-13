import type { LoanOptions, LoanSummary, RateAdjustment, ScheduleRow, SinglePayment, TotalData } from './mtqLoans.types'
import dayjs from 'dayjs'
import {
  FIRST_REPAYMENT_DATE_INVALID_MESSAGE,
  FIRST_REPAYMENT_DATE_ORDER_INVALID_MESSAGE,
  INTEREST_START_DATE_INVALID_MESSAGE,
  LENDING_RATES_INVALID_MESSAGE,
  LOAN_AMOUNT_INVALID_MESSAGE,
  LOAN_MONTH_INVALID_MESSAGE,
  PREPAYMENT_ORDER_INVALID_MESSAGE,
  RATE_ADJUSTMENT_DATE_INVALID_MESSAGE,
  RATE_ADJUSTMENT_DATE_ORDER_INVALID_MESSAGE,
  RATE_ADJUSTMENT_DUPLICATE_DATE_MESSAGE,
  RATE_ADJUSTMENT_PERIOD_CONFLICT_MESSAGE,
  RATE_ADJUSTMENT_VALUE_INVALID_MESSAGE,
} from './mtqLoans.magicconst'

/**
 * Excel PMT 函数的等价实现。
 * 参考: http://stackoverflow.com/questions/2094967/excel-pmt-function-in-js
 */
export function pmt(ratePerPeriod: number, numberOfPayments: number, presentValue: number, futureValue?: number, type?: 0 | 1): number {
  futureValue = typeof futureValue !== 'undefined' ? futureValue : 0
  type = typeof type !== 'undefined' ? type : 0

  if (ratePerPeriod !== 0.0) {
    const q = (1 + ratePerPeriod) ** numberOfPayments
    return -(ratePerPeriod * (futureValue + (q * presentValue))) / ((-1 + q) * (1 + ratePerPeriod * (type)))
  }
  if (numberOfPayments !== 0.0) {
    return -(futureValue + presentValue) / numberOfPayments
  }

  return 0
}

const DATE_FORMAT = 'YYYY/MM/DD'
const DAYS_PER_YEAR = 360
const DAYS_PER_PERIOD = 30

function compareRepaymentDateAsc<T extends { repaymentDate: string }>(a: T, b: T) {
  return dayjs(a.repaymentDate).valueOf() - dayjs(b.repaymentDate).valueOf()
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function toMoney(value: number): number {
  return roundTo(value, 2)
}

function calcActualDays(startDate: dayjs.Dayjs, endDate: dayjs.Dayjs): number {
  if (!startDate.isValid() || !endDate.isValid()) {
    return 0
  }
  return Math.max(endDate.startOf('day').diff(startDate.startOf('day'), 'day'), 0)
}

function calcDailyRate(annualRate: number): number {
  return (annualRate / 100) / DAYS_PER_YEAR
}

function calcMonthlyRateForPmt(annualRate: number): number {
  return (annualRate / 100) / 12
}

function calcDailyInterest(principal: number, annualRate: number, days: number): number {
  if (principal <= 0 || annualRate <= 0 || days <= 0) {
    return 0
  }
  return toMoney(principal * calcDailyRate(annualRate) * days)
}

function calcPeriodInterestByDateSpan(principal: number, annualRate: number, startDate: dayjs.Dayjs, dueDate: dayjs.Dayjs): number {
  if (principal <= 0 || annualRate <= 0) {
    return 0
  }

  const fullMonths = dueDate.diff(startDate, 'month')
  const anchorDate = startDate.add(fullMonths, 'month')
  const extraDays = calcActualDays(anchorDate, dueDate)
  const monthlyPart = fullMonths > 0 ? toMoney(principal * calcMonthlyRateForPmt(annualRate) * fullMonths) : 0
  const dailyPart = calcDailyInterest(principal, annualRate, extraDays)
  return toMoney(monthlyPart + dailyPart)
}

function calcAdjustmentPeriodInterest(principal: number, oldRate: number, newRate: number, oldDays: number): number {
  const clampedOldDays = Math.min(Math.max(oldDays, 0), DAYS_PER_PERIOD)
  const newDays = DAYS_PER_PERIOD - clampedOldDays
  const oldPart = principal * ((oldRate / 100) / DAYS_PER_YEAR) * clampedOldDays
  const newPart = principal * ((newRate / 100) / DAYS_PER_YEAR) * newDays
  return toMoney(oldPart + newPart)
}

function buildMonthlyRow(
  rowKey: string,
  times: number,
  dueDate: dayjs.Dayjs,
  remainingPrincipal: number,
  remainingMonths: number,
  rate: number,
  periodInterest: number,
  periodInterestBase: number,
  repayment: LoanOptions['repayment'],
  fixedEqualLoanAmount?: number,
): { row: ScheduleRow, principalRepayment: number, interestRepayment: number, monthlyAmount: number } {
  let principal: number
  const roundedPeriodInterest = toMoney(periodInterest)

  if (repayment === 'equalLoan') {
    if (remainingMonths === 1) {
      principal = toMoney(remainingPrincipal)
    }
    else {
      const periodAmount = typeof fixedEqualLoanAmount === 'number'
        ? fixedEqualLoanAmount
        : toMoney(-pmt(calcMonthlyRateForPmt(rate), remainingMonths, remainingPrincipal))
      const principalBase = times === 1 ? periodInterestBase : roundedPeriodInterest
      principal = toMoney(periodAmount - principalBase)
    }
  }
  else {
    if (remainingMonths === 1) {
      principal = toMoney(remainingPrincipal)
    }
    else {
      principal = toMoney(remainingPrincipal / remainingMonths)
    }
  }

  if (principal > toMoney(remainingPrincipal)) {
    principal = toMoney(remainingPrincipal)
  }

  const amount = toMoney(principal + roundedPeriodInterest)

  return {
    row: {
      key: rowKey,
      rowType: 'normal',
      times,
      repaymentDate: dueDate.format(DATE_FORMAT),
      monthlyAmount: amount,
      interestRepayment: roundedPeriodInterest,
      principalRepayment: principal,
      applicableRate: toMoney(rate),
      remainingPrincipal: 0,
    },
    principalRepayment: principal,
    interestRepayment: roundedPeriodInterest,
    monthlyAmount: amount,
  }
}

export function isPrepaymentOrderValid(interestStartDate: string, prepayment: SinglePayment[]): boolean {
  if (prepayment.length === 0) {
    return true
  }
  const startDate = dayjs(interestStartDate)
  if (!startDate.isValid()) {
    return false
  }

  let prev = startDate
  for (const item of prepayment) {
    const current = dayjs(item.repaymentDate)
    if (!current.isValid() || current.isBefore(prev, 'day')) {
      return false
    }
    prev = current
  }

  return true
}

export function createLoanOptionsFromData(data: TotalData): LoanOptions {
  return {
    loanAmount: Number(data.loanAmount),
    loanMonth: Number(data.loanMonth),
    lendingRates: Number(data.lendingRates),
    repayment: data.repayment,
    interestStartDate: data.interestStartDate,
    firstRepaymentDate: data.firstRepaymentDate,
    prepayment: data.prepayment
      .map(item => ({
        repaymentDate: item.repaymentDate,
        repaymentAmount: Number(item.repaymentAmount || 0),
        adjustLoanMonth: Number(item.adjustLoanMonth || 0),
        extraCharge: Number.isFinite(item.extraCharge) ? Number(item.extraCharge) : undefined,
      }))
      .sort(compareRepaymentDateAsc),
    rateAdjustments: data.rateAdjustments
      .map(item => ({
        repaymentDate: item.repaymentDate,
        lendingRates: Number(item.lendingRates),
      }))
      .sort(compareRepaymentDateAsc),
  }
}

export function validateLoanData(data: TotalData): string {
  const options = createLoanOptionsFromData(data)

  if (!Number.isFinite(options.loanAmount) || options.loanAmount <= 0) {
    return LOAN_AMOUNT_INVALID_MESSAGE
  }
  if (!Number.isInteger(options.loanMonth) || options.loanMonth <= 0) {
    return LOAN_MONTH_INVALID_MESSAGE
  }
  if (!Number.isFinite(options.lendingRates) || options.lendingRates < 0) {
    return LENDING_RATES_INVALID_MESSAGE
  }
  if (!dayjs(options.interestStartDate).isValid()) {
    return INTEREST_START_DATE_INVALID_MESSAGE
  }
  if (!dayjs(options.firstRepaymentDate).isValid()) {
    return FIRST_REPAYMENT_DATE_INVALID_MESSAGE
  }
  if (!dayjs(options.firstRepaymentDate).isAfter(dayjs(options.interestStartDate), 'day')) {
    return FIRST_REPAYMENT_DATE_ORDER_INVALID_MESSAGE
  }
  if (!isPrepaymentOrderValid(options.interestStartDate, options.prepayment)) {
    return PREPAYMENT_ORDER_INVALID_MESSAGE
  }

  const usedDates = new Set<string>()
  for (const item of options.rateAdjustments || []) {
    if (!dayjs(item.repaymentDate).isValid()) {
      return RATE_ADJUSTMENT_DATE_INVALID_MESSAGE
    }
    if (dayjs(item.repaymentDate).isBefore(dayjs(options.interestStartDate), 'day')) {
      return RATE_ADJUSTMENT_DATE_ORDER_INVALID_MESSAGE
    }
    if (!Number.isFinite(item.lendingRates) || item.lendingRates < 0) {
      return RATE_ADJUSTMENT_VALUE_INVALID_MESSAGE
    }
    if (usedDates.has(item.repaymentDate)) {
      return RATE_ADJUSTMENT_DUPLICATE_DATE_MESSAGE
    }
    usedDates.add(item.repaymentDate)
  }

  try {
    buildSchedule(options, true)
  }
  catch (error) {
    if (error instanceof Error) {
      return error.message
    }
    throw error
  }

  return ''
}

export function buildSchedule(options: LoanOptions, includePrepayment = true): ScheduleRow[] {
  const interestStartDate = dayjs(options.interestStartDate)
  const firstDate = dayjs(options.firstRepaymentDate)
  const rows: ScheduleRow[] = [
    {
      key: 'opening',
      rowType: 'opening',
      times: 0,
      repaymentDate: interestStartDate.format(DATE_FORMAT),
      applicableRate: toMoney(options.lendingRates),
      remainingPrincipal: toMoney(options.loanAmount),
    },
  ]

  const payments = includePrepayment
    ? structuredClone(options.prepayment)
        .filter(item => dayjs(item.repaymentDate).isValid())
        .sort(compareRepaymentDateAsc)
    : []

  const rawRateAdjustments = includePrepayment ? structuredClone(options.rateAdjustments || []) : []
  const uniqueRateAdjustments = rawRateAdjustments
    .filter(item => dayjs(item.repaymentDate).isValid() && Number.isFinite(item.lendingRates) && item.lendingRates >= 0)
    .sort(compareRepaymentDateAsc)
    .filter((item, index, arr) => index === 0 || !dayjs(item.repaymentDate).isSame(dayjs(arr[index - 1]!.repaymentDate), 'day'))

  let paymentIndex = 0
  let rateAdjustmentIndex = 0
  let currentRate = Number(options.lendingRates)
  let remainingPrincipal = Number(options.loanAmount)
  let remainingMonths = Math.max(Math.trunc(options.loanMonth), 0)
  let period = 1
  let monthsElapsed = 0
  let nextRegularDueDate = firstDate
  let lastRepaymentDate = interestStartDate
  let segmentEqualLoanAmount: number | undefined

  function recalcSegmentEqualLoanAmount() {
    if (options.repayment !== 'equalLoan' || remainingMonths <= 1 || remainingPrincipal <= 0) {
      segmentEqualLoanAmount = undefined
      return
    }
    segmentEqualLoanAmount = toMoney(-pmt(calcMonthlyRateForPmt(currentRate), remainingMonths, remainingPrincipal))
  }

  function applyPrepayment(payment: SinglePayment, paymentDate: dayjs.Dayjs) {
    const repaymentAmount = toMoney(Math.max(Number(payment.repaymentAmount) || 0, 0))
    const principalRepayment = Math.min(repaymentAmount, toMoney(remainingPrincipal))
    const autoInterestCharge = calcDailyInterest(principalRepayment, currentRate, calcActualDays(lastRepaymentDate, paymentDate))
    const extraCharge = Number.isFinite(payment.extraCharge)
      ? toMoney(Math.max(Number(payment.extraCharge) || 0, 0))
      : autoInterestCharge
    const adjustLoanMonth = Math.max(Math.trunc(Number(payment.adjustLoanMonth) || 0), 0)

    remainingPrincipal = Math.max(remainingPrincipal - principalRepayment, 0)
    remainingMonths = Math.max(remainingMonths - adjustLoanMonth, 0)
    recalcSegmentEqualLoanAmount()

    rows.push({
      key: `prepayment-${paymentIndex + 1}-${dayjs(payment.repaymentDate).format('YYYYMMDD')}`,
      rowType: 'prepayment',
      repaymentDate: paymentDate.format(DATE_FORMAT),
      interestRepayment: extraCharge,
      principalRepayment,
      extraCharge,
      applicableRate: toMoney(currentRate),
      remainingPrincipal: toMoney(remainingPrincipal),
    })
  }

  function applyRateAdjustment(rateAdjustment: RateAdjustment, effectiveTimes: number) {
    const nextRate = Number(rateAdjustment.lendingRates)

    rows.push({
      key: `rate-adjustment-${effectiveTimes}-${dayjs(rateAdjustment.repaymentDate).format('YYYYMMDD')}`,
      rowType: 'rateAdjustment',
      repaymentDate: dayjs(rateAdjustment.repaymentDate).format(DATE_FORMAT),
      rateBefore: toMoney(currentRate),
      rateAfter: toMoney(nextRate),
      remainingPrincipal: toMoney(remainingPrincipal),
    })

    currentRate = nextRate
    recalcSegmentEqualLoanAmount()
  }

  recalcSegmentEqualLoanAmount()

  while (remainingMonths > 0 && remainingPrincipal > 0) {
    const dueDate = remainingMonths === 1
      ? interestStartDate.add(monthsElapsed + 1, 'month')
      : nextRegularDueDate

    let firstAdjustmentForInterest: { oldRate: number, newRate: number, oldDays: number } | null = null
    let adjustmentAppliedThisPeriod = false

    // 到期日前将提前还款与调息按时间线合并处理。
    while (true) {
      const nextPayment = payments[paymentIndex]
      const nextAdjustment = uniqueRateAdjustments[rateAdjustmentIndex]
      const nextPaymentDate = nextPayment ? dayjs(nextPayment.repaymentDate) : null
      const nextAdjustmentDate = nextAdjustment ? dayjs(nextAdjustment.repaymentDate) : null
      const paymentBeforeDue = Boolean(nextPaymentDate?.isValid() && nextPaymentDate.isBefore(dueDate, 'day'))
      const adjustmentBeforeDue = Boolean(nextAdjustmentDate?.isValid() && nextAdjustmentDate.isBefore(dueDate, 'day'))

      if (!paymentBeforeDue && !adjustmentBeforeDue) {
        break
      }

      const usePayment = paymentBeforeDue && (!adjustmentBeforeDue || nextPaymentDate!.valueOf() <= nextAdjustmentDate!.valueOf())
      if (usePayment) {
        applyPrepayment(nextPayment!, nextPaymentDate!)
        paymentIndex++
      }
      else {
        if (adjustmentAppliedThisPeriod) {
          throw new Error(RATE_ADJUSTMENT_PERIOD_CONFLICT_MESSAGE)
        }

        const oldRate = currentRate
        applyRateAdjustment(nextAdjustment!, period)
        adjustmentAppliedThisPeriod = true
        const oldDays = calcActualDays(lastRepaymentDate, nextAdjustmentDate!)
        if (!firstAdjustmentForInterest) {
          firstAdjustmentForInterest = {
            oldRate,
            newRate: currentRate,
            oldDays,
          }
        }
        rateAdjustmentIndex++
      }

      if (remainingMonths <= 0 || remainingPrincipal <= 0) {
        break
      }
    }

    if (remainingMonths <= 0 || remainingPrincipal <= 0) {
      break
    }

    const interestRepayment = firstAdjustmentForInterest
      ? calcAdjustmentPeriodInterest(remainingPrincipal, firstAdjustmentForInterest.oldRate, firstAdjustmentForInterest.newRate, firstAdjustmentForInterest.oldDays)
      : calcPeriodInterestByDateSpan(remainingPrincipal, currentRate, lastRepaymentDate, dueDate)
    const periodInterestBase = toMoney(remainingPrincipal * calcMonthlyRateForPmt(currentRate))

    const monthly = buildMonthlyRow(
      `period-${period}`,
      period,
      dueDate,
      remainingPrincipal,
      remainingMonths,
      currentRate,
      interestRepayment,
      periodInterestBase,
      options.repayment,
      segmentEqualLoanAmount,
    )

    remainingPrincipal = Math.max(remainingPrincipal - monthly.principalRepayment, 0)
    remainingMonths--
    monthsElapsed++
    lastRepaymentDate = dueDate
    nextRegularDueDate = dueDate.add(1, 'month')

    rows.push({
      ...monthly.row,
      remainingPrincipal: toMoney(remainingPrincipal),
    })

    // 还款日当日提前还款：不改变当期月供，仅影响后续期次。
    while (paymentIndex < payments.length) {
      const payment = payments[paymentIndex]!
      const paymentDate = dayjs(payment.repaymentDate)
      if (!paymentDate.isValid() || !paymentDate.isSame(dueDate, 'day')) {
        break
      }
      applyPrepayment(payment, paymentDate)
      paymentIndex++
      if (remainingMonths <= 0 || remainingPrincipal <= 0) {
        break
      }
    }

    // 还款日当日调息：与同日提前还款规则一致，从下一期生效。
    while (rateAdjustmentIndex < uniqueRateAdjustments.length) {
      const rateAdjustment = uniqueRateAdjustments[rateAdjustmentIndex]!
      const adjustmentDate = dayjs(rateAdjustment.repaymentDate)
      if (!adjustmentDate.isValid() || !adjustmentDate.isSame(dueDate, 'day')) {
        break
      }
      if (adjustmentAppliedThisPeriod) {
        throw new Error(RATE_ADJUSTMENT_PERIOD_CONFLICT_MESSAGE)
      }
      applyRateAdjustment(rateAdjustment, period + 1)
      adjustmentAppliedThisPeriod = true
      rateAdjustmentIndex++
      if (remainingMonths <= 0 || remainingPrincipal <= 0) {
        break
      }
    }

    if (remainingMonths <= 0 || remainingPrincipal <= 0) {
      break
    }

    period++
  }

  return rows
}

function sumBy(rows: ScheduleRow[], field: keyof ScheduleRow, rowType?: ScheduleRow['rowType']): number {
  let total = 0
  for (const row of rows) {
    if (rowType && row.rowType !== rowType) {
      continue
    }
    total += Number(row[field] || 0)
  }
  return toMoney(total)
}

export function calcLoanSummary(options: LoanOptions, originalRows: ScheduleRow[], currentRows: ScheduleRow[]): LoanSummary {
  const originalInterest = sumBy(originalRows, 'interestRepayment', 'normal')
  const currentInterest = sumBy(currentRows, 'interestRepayment', 'normal')
  const prepaymentPrincipal = sumBy(currentRows, 'principalRepayment', 'prepayment')
  const adjustLoanMonth = toMoney(options.prepayment.reduce((acc, item) => acc + Math.max(item.adjustLoanMonth || 0, 0), 0))
  const totalExtraCharge = sumBy(currentRows, 'extraCharge', 'prepayment')
  const endingPrincipal = toMoney(currentRows.at(-1)?.remainingPrincipal || 0)

  const originalTotalOutflow = toMoney(options.loanAmount + originalInterest)
  const currentTotalOutflow = toMoney(options.loanAmount + currentInterest + totalExtraCharge)

  return {
    principal: {
      loanAmount: toMoney(options.loanAmount),
      cumulativePrepaymentPrincipal: prepaymentPrincipal,
      cumulativeAdjustLoanMonth: adjustLoanMonth,
      endingPrincipal,
    },
    interest: {
      originalCumulativeInterestPayment: originalInterest,
      cumulativeInterestPayment: currentInterest,
      savedMoney: toMoney(originalInterest - currentInterest),
    },
    extra: {
      totalExtraCharge,
    },
    originalTotalOutflow,
    currentTotalOutflow,
    netOutflowSaved: toMoney(originalTotalOutflow - currentTotalOutflow),
  }
}
