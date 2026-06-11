import type { LoanOptions, RateAdjustment, ScheduleRow, SinglePayment } from './mtqLoans.types'

export const mtqLoansBaseOptions: LoanOptions = {
  loanAmount: 1100000,
  loanMonth: 120,
  lendingRates: 5.9,
  repayment: 'equalLoan',
  interestStartDate: '2020-05-28',
  firstRepaymentDate: '2020-06-11',
  prepayment: [],
  rateAdjustments: [],
}

export const mtqLoansStrictBankPrepayments: SinglePayment[] = [
  {
    repaymentDate: '2020-07-20',
    repaymentAmount: 130000.58,
    adjustLoanMonth: 0,
  },
  {
    repaymentDate: '2020-09-03',
    repaymentAmount: 100000,
    adjustLoanMonth: 0,
  },
  {
    repaymentDate: '2021-03-11',
    repaymentAmount: 120000,
    adjustLoanMonth: 0,
  },
  {
    repaymentDate: '2021-03-31',
    repaymentAmount: 200000,
    adjustLoanMonth: 0,
  },
  {
    repaymentDate: '2025-04-01',
    repaymentAmount: 305480.99,
    adjustLoanMonth: 0,
  },
]

export const mtqLoansStrictBankRateAdjustments: RateAdjustment[] = [
  {
    repaymentDate: '2022/05/28',
    lendingRates: 5.7,
  },
  {
    repaymentDate: '2023-05-28',
    lendingRates: 5.55,
  },
  {
    repaymentDate: '2023-09-25',
    lendingRates: 4.3,
  },
  {
    repaymentDate: '2024-05-28',
    lendingRates: 3.95,
  },
  {
    repaymentDate: '2024-10-25',
    lendingRates: 3.65,
  },
]

export interface ScheduleExpectation {
  repaymentDate: string
  principalRepayment: number
  interestRepayment: number
  monthlyAmount?: number
}

export const mtqLoansStrictBankExpected: {
  normal: ScheduleExpectation[]
  prepayment: Array<Pick<ScheduleRow, 'repaymentDate' | 'principalRepayment' | 'interestRepayment'>>
} = {
  normal: [
    { repaymentDate: '2020/06/11', principalRepayment: 6748.76, interestRepayment: 2523.89, monthlyAmount: 9272.65 },
    { repaymentDate: '2020/07/11', principalRepayment: 6781.94, interestRepayment: 5375.15, monthlyAmount: 12157.09 },
    { repaymentDate: '2020/08/11', principalRepayment: 5999.8, interestRepayment: 4702.64, monthlyAmount: 10702.44 },
    { repaymentDate: '2020/09/11', principalRepayment: 5394.96, interestRepayment: 4181.47, monthlyAmount: 9576.43 },
    { repaymentDate: '2021/03/11', principalRepayment: 5556.08, interestRepayment: 4020.35, monthlyAmount: 9576.43 },
    { repaymentDate: '2021/04/11', principalRepayment: 3383.43, interestRepayment: 2419.70, monthlyAmount: 5803.13 },
    { repaymentDate: '2022/05/11', principalRepayment: 3606.18, interestRepayment: 2196.95, monthlyAmount: 5803.13 },
    { repaymentDate: '2022/06/11', principalRepayment: 3612.94, interestRepayment: 2147.21, monthlyAmount: 5760.15 },
    { repaymentDate: '2023/05/11', principalRepayment: 3850.16, interestRepayment: 1909.99, monthlyAmount: 5760.15 },
    { repaymentDate: '2023/06/11', principalRepayment: 3862.24, interestRepayment: 1870.13, monthlyAmount: 5732.37 },
    { repaymentDate: '2023/09/11', principalRepayment: 3944.55, interestRepayment: 1787.82, monthlyAmount: 5732.37 },
    { repaymentDate: '2023/10/11', principalRepayment: 3952.35, interestRepayment: 1557.02, monthlyAmount: 5509.37 },
    { repaymentDate: '2024/05/11', principalRepayment: 4242.59, interestRepayment: 1266.78, monthlyAmount: 5509.37 },
    { repaymentDate: '2024/06/11', principalRepayment: 4249.12, interestRepayment: 1207.43, monthlyAmount: 5456.55 },
    { repaymentDate: '2024/10/11', principalRepayment: 4363.64, interestRepayment: 1092.91, monthlyAmount: 5456.55 },
    { repaymentDate: '2024/11/11', principalRepayment: 4378.21, interestRepayment: 1034.86, monthlyAmount: 5413.07 },
  ],
  prepayment: [
    { repaymentDate: '2020/07/20', principalRepayment: 130000.58, interestRepayment: 191.75 },
    { repaymentDate: '2020/09/03', principalRepayment: 100000, interestRepayment: 376.94 },
    { repaymentDate: '2021/03/11', principalRepayment: 120000, interestRepayment: 0 },
    { repaymentDate: '2021/03/31', principalRepayment: 200000, interestRepayment: 655.56 },
    { repaymentDate: '2025/04/01', principalRepayment: 305480.99, interestRepayment: 650.42 },
  ],
}
