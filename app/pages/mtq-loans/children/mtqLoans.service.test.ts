import type { LoanOptions, ScheduleRow, SinglePayment, TotalData } from './mtqLoans.types'
import { describe, expect, it } from 'vitest'
import { mtqLoansBaseOptions, mtqLoansStrictBankExpected, mtqLoansStrictBankPrepayments, mtqLoansStrictBankRateAdjustments } from './mtqLoans.bank-reference.fixture'
import {
  PREPAYMENT_ORDER_INVALID_MESSAGE,
  RATE_ADJUSTMENT_PERIOD_CONFLICT_MESSAGE,
} from './mtqLoans.magicconst'
import { buildSchedule, calcLoanSummary, isPrepaymentOrderValid, validateLoanData } from './mtqLoans.service'

function createOptions(overrides: Partial<LoanOptions> = {}): LoanOptions {
  return {
    ...mtqLoansBaseOptions,
    prepayment: [...mtqLoansBaseOptions.prepayment],
    rateAdjustments: [...(mtqLoansBaseOptions.rateAdjustments || [])],
    ...overrides,
  }
}

function createTotalData(overrides: Partial<TotalData> = {}): TotalData {
  return {
    loanAmount: mtqLoansBaseOptions.loanAmount,
    repaymentPeriod: 0,
    loanMonth: mtqLoansBaseOptions.loanMonth,
    lendingRates: mtqLoansBaseOptions.lendingRates,
    repayment: mtqLoansBaseOptions.repayment,
    interestStartDate: mtqLoansBaseOptions.interestStartDate,
    firstRepaymentDate: mtqLoansBaseOptions.firstRepaymentDate,
    prepayment: [...mtqLoansBaseOptions.prepayment],
    rateAdjustments: [...(mtqLoansBaseOptions.rateAdjustments || [])],
    ...overrides,
  }
}

function normalRows(rows: ScheduleRow[]) {
  return rows.filter(row => row.rowType === 'normal')
}

function prepaymentRows(rows: ScheduleRow[]) {
  return rows.filter(row => row.rowType === 'prepayment')
}

describe('mtqLoans 服务', () => {
  describe('isPrepaymentOrderValid', () => {
    it('提前还款日期递增且不早于计息日时返回 true', () => {
      const prepayment: SinglePayment[] = [
        { repaymentDate: '2020-06-10', repaymentAmount: 1000, adjustLoanMonth: 0 },
        { repaymentDate: '2020-07-10', repaymentAmount: 1000, adjustLoanMonth: 0 },
      ]

      expect(isPrepaymentOrderValid('2020-05-28', prepayment)).toBe(true)
    })

    it('提前还款日期乱序或早于计息日时返回 false', () => {
      const earlier: SinglePayment[] = [
        { repaymentDate: '2020-05-27', repaymentAmount: 1000, adjustLoanMonth: 0 },
      ]
      const disorder: SinglePayment[] = [
        { repaymentDate: '2020-06-10', repaymentAmount: 1000, adjustLoanMonth: 0 },
        { repaymentDate: '2020-06-05', repaymentAmount: 1000, adjustLoanMonth: 0 },
      ]

      expect(isPrepaymentOrderValid('2020-05-28', earlier)).toBe(false)
      expect(isPrepaymentOrderValid('2020-05-28', disorder)).toBe(false)
    })
  })

  describe('validateLoanData', () => {
    it('统一校验可返回提前还款顺序错误文案', () => {
      const message = validateLoanData(createTotalData({
        prepayment: [
          { repaymentDate: '2020-05-27', repaymentAmount: 1000, adjustLoanMonth: 0 },
        ],
      }))

      expect(message).toBe(PREPAYMENT_ORDER_INVALID_MESSAGE)
    })

    it('统一校验可返回同一期多次调息冲突文案', () => {
      const message = validateLoanData(createTotalData({
        interestStartDate: '2024-01-01',
        firstRepaymentDate: '2024-02-01',
        rateAdjustments: [
          { repaymentDate: '2024-01-10', lendingRates: 5.8 },
          { repaymentDate: '2024-01-20', lendingRates: 5.6 },
        ],
      }))

      expect(message).toBe(RATE_ADJUSTMENT_PERIOD_CONFLICT_MESSAGE)
    })

    it('统一校验允许用户直接填写期内调息日期', () => {
      const message = validateLoanData(createTotalData({
        interestStartDate: '2024-01-01',
        firstRepaymentDate: '2024-02-01',
        rateAdjustments: [
          { repaymentDate: '2024-01-15', lendingRates: 5.8 },
        ],
      }))

      expect(message).toBe('')
    })
  })

  describe('buildSchedule', () => {
    it('与银行导出综合数据完全一致', () => {
      const rows = buildSchedule(createOptions({
        prepayment: mtqLoansStrictBankPrepayments,
        rateAdjustments: mtqLoansStrictBankRateAdjustments,
      }), true)

      const normal = normalRows(rows)
      const prepayment = prepaymentRows(rows)

      mtqLoansStrictBankExpected.normal.forEach((expected) => {
        const row = normal.find(item => item.repaymentDate === expected.repaymentDate)
        expect(row).toBeTruthy()
        expect(row?.principalRepayment).toBe(expected.principalRepayment)
        expect(row?.interestRepayment).toBe(expected.interestRepayment)
        expect(row?.monthlyAmount).toBe(expected.monthlyAmount)
      })

      mtqLoansStrictBankExpected.prepayment.forEach((expected) => {
        const row = prepayment.find(item => item.repaymentDate === expected.repaymentDate)
        expect(row).toBeTruthy()
        expect(row?.principalRepayment).toBe(expected.principalRepayment)
        expect(row?.interestRepayment).toBe(expected.interestRepayment)
      })
    })

    it('提前还款自动利息按原始日利率计算', () => {
      const rows = buildSchedule(createOptions({
        loanAmount: 100000,
        loanMonth: 12,
        lendingRates: 5.95,
        interestStartDate: '2024-01-01',
        firstRepaymentDate: '2024-02-01',
        prepayment: [
          {
            repaymentDate: '2024-01-11',
            repaymentAmount: 10000,
            adjustLoanMonth: 0,
          },
        ],
        rateAdjustments: [],
      }), true)

      const row = prepaymentRows(rows)[0]
      expect(row?.interestRepayment).toBe(16.53)
      expect(row?.extraCharge).toBe(16.53)
    })

    it('还款日当日提前还款不影响当期月供', () => {
      const base = createOptions({
        loanAmount: 100000,
        loanMonth: 12,
        lendingRates: 4.8,
        interestStartDate: '2024-01-01',
        firstRepaymentDate: '2024-02-01',
        prepayment: [],
        rateAdjustments: [],
      })

      const withSameDayPrepayment = createOptions({
        ...base,
        prepayment: [
          {
            repaymentDate: '2024-02-01',
            repaymentAmount: 20000,
            adjustLoanMonth: 0,
          },
        ],
      })

      const baseFirst = normalRows(buildSchedule(base, true))[0]
      const prepayFirst = normalRows(buildSchedule(withSameDayPrepayment, true))[0]

      expect(prepayFirst?.monthlyAmount).toBe(baseFirst?.monthlyAmount)
      expect(prepayFirst?.interestRepayment).toBe(baseFirst?.interestRepayment)
    })

    it('调息期利息按旧新利率拆分且天数之和为30', () => {
      const rows = buildSchedule(createOptions({
        loanAmount: 100000,
        loanMonth: 12,
        lendingRates: 6,
        repayment: 'equalPrincipal',
        interestStartDate: '2024-01-01',
        firstRepaymentDate: '2024-02-01',
        prepayment: [],
        rateAdjustments: [
          { repaymentDate: '2024-01-11', lendingRates: 3 },
        ],
      }), true)

      const firstNormal = normalRows(rows)[0]
      const oldDays = 10
      const newDays = 20

      expect(oldDays + newDays).toBe(30)
      expect(firstNormal?.interestRepayment).toBe(333.33)
    })

    it('同一期内存在多次调息时抛出错误', () => {
      expect(() => buildSchedule(createOptions({
        loanAmount: 100000,
        loanMonth: 12,
        lendingRates: 6,
        interestStartDate: '2024-01-01',
        firstRepaymentDate: '2024-02-01',
        prepayment: [],
        rateAdjustments: [
          { repaymentDate: '2024-01-10', lendingRates: 5.8 },
          { repaymentDate: '2024-01-20', lendingRates: 5.6 },
        ],
      }), true)).toThrowError(RATE_ADJUSTMENT_PERIOD_CONFLICT_MESSAGE)
    })

    it('同一日期的提前还款与调息按原算法顺序计算', () => {
      const rows = buildSchedule(createOptions({
        loanAmount: 100000,
        loanMonth: 12,
        lendingRates: 4.8,
        interestStartDate: '2024-01-01',
        firstRepaymentDate: '2024-02-01',
        prepayment: [
          { repaymentDate: '2024-01-15', repaymentAmount: 10000, adjustLoanMonth: 0 },
        ],
        rateAdjustments: [
          { repaymentDate: '2024-01-15', lendingRates: 4.2 },
        ],
      }), true)

      const sameDayRows = rows.filter(row => ['prepayment', 'rateAdjustment'].includes(row.rowType) && row.repaymentDate === '2024/01/15')

      expect(sameDayRows.map(row => row.rowType)).toEqual(['prepayment', 'rateAdjustment'])
    })

    it('非调息行展示当前适用利率，调息行展示前后利率', () => {
      const rows = buildSchedule(createOptions({
        loanAmount: 100000,
        loanMonth: 12,
        lendingRates: 4.8,
        interestStartDate: '2024-01-01',
        firstRepaymentDate: '2024-02-01',
        prepayment: [
          { repaymentDate: '2024-01-15', repaymentAmount: 10000, adjustLoanMonth: 0 },
        ],
        rateAdjustments: [
          { repaymentDate: '2024-01-20', lendingRates: 4.2 },
        ],
      }), true)

      const openingRow = rows[0]
      const prepaymentRow = rows.find(row => row.rowType === 'prepayment')
      const rateAdjustmentRow = rows.find(row => row.rowType === 'rateAdjustment')
      const firstNormalRow = rows.find(row => row.rowType === 'normal')

      expect(openingRow?.applicableRate).toBe(4.8)
      expect(prepaymentRow?.applicableRate).toBe(4.8)
      expect(rateAdjustmentRow?.rateBefore).toBe(4.8)
      expect(rateAdjustmentRow?.rateAfter).toBe(4.2)
      expect(rateAdjustmentRow?.times).toBeUndefined()
      expect(firstNormalRow?.applicableRate).toBe(4.2)
    })

    it('首期非整月时末期还款日与计息日对齐', () => {
      const rows = buildSchedule(createOptions({
        loanAmount: 100000,
        loanMonth: 3,
        lendingRates: 4.5,
        interestStartDate: '2020-05-28',
        firstRepaymentDate: '2020-06-11',
        prepayment: [],
        rateAdjustments: [],
      }), true)

      const dates = normalRows(rows).map(row => row.repaymentDate)
      expect(dates).toEqual(['2020/06/11', '2020/07/11', '2020/08/28'])
    })

    it('等额本息在同利率区间内月供固定（非末期）', () => {
      const rows = buildSchedule(createOptions({
        loanAmount: 300000,
        loanMonth: 12,
        lendingRates: 4.2,
        interestStartDate: '2024-01-01',
        firstRepaymentDate: '2024-02-01',
        prepayment: [],
        rateAdjustments: [],
      }), true)

      const monthly = normalRows(rows)
      expect(monthly[0]?.monthlyAmount).toBe(monthly[1]?.monthlyAmount)
      expect(monthly[1]?.monthlyAmount).toBe(monthly[2]?.monthlyAmount)
    })
  })

  describe('calcLoanSummary', () => {
    it('汇总可正确累加提前还本金与额外费用', () => {
      const options = createOptions({
        prepayment: [
          {
            repaymentDate: '2020-06-05',
            repaymentAmount: 200000,
            adjustLoanMonth: 0,
          },
        ],
      })

      const originalRows = buildSchedule({ ...options, prepayment: [] }, false)
      const currentRows = buildSchedule(options, true)
      const summary = calcLoanSummary(options, originalRows, currentRows)

      expect(summary.principal.cumulativePrepaymentPrincipal).toBe(200000)
      expect(summary.extra.totalExtraCharge).toBe(262.22)
      expect(summary.currentTotalOutflow).toBe(
        Number((summary.principal.loanAmount + summary.interest.cumulativeInterestPayment + summary.extra.totalExtraCharge).toFixed(2)),
      )
      expect(summary.netOutflowSaved).toBe(
        Number((summary.originalTotalOutflow - summary.currentTotalOutflow).toFixed(2)),
      )
    })
  })
})
