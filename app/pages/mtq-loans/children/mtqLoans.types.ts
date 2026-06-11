export type RepaymentType = 'equalLoan' | 'equalPrincipal'

export interface SinglePayment {
  repaymentDate: string
  repaymentAmount: number
  adjustLoanMonth: number
  extraCharge?: number
}

export interface RateAdjustment {
  repaymentDate: string
  lendingRates: number
}

export type LoanEventDisplayItem
  = { kind: 'prepayment', item: SinglePayment }
    | { kind: 'rateAdjustment', item: RateAdjustment }

export interface TotalData {
  loanAmount: number
  repaymentPeriod: number
  loanMonth: number
  lendingRates: number
  repayment: RepaymentType
  interestStartDate: string
  firstRepaymentDate: string
  prepayment: SinglePayment[]
  rateAdjustments: RateAdjustment[]
}

export interface LoanOptions {
  loanAmount: number
  loanMonth: number
  lendingRates: number
  repayment: RepaymentType
  interestStartDate: string
  firstRepaymentDate: string
  prepayment: SinglePayment[]
  rateAdjustments?: RateAdjustment[]
}

export interface ScheduleRow {
  key: string
  rowType: 'normal' | 'prepayment' | 'opening' | 'rateAdjustment'
  times?: number
  repaymentDate: string
  monthlyAmount?: number
  interestRepayment?: number
  principalRepayment?: number
  extraCharge?: number
  applicableRate?: number
  rateBefore?: number
  rateAfter?: number
  remainingPrincipal: number
}

export interface SummarySectionPrincipal {
  loanAmount: number
  cumulativePrepaymentPrincipal: number
  cumulativeAdjustLoanMonth: number
  endingPrincipal: number
}

export interface SummarySectionInterest {
  originalCumulativeInterestPayment: number
  cumulativeInterestPayment: number
  savedMoney: number
}

export interface SummarySectionExtra {
  totalExtraCharge: number
}

export interface LoanSummary {
  principal: SummarySectionPrincipal
  interest: SummarySectionInterest
  extra: SummarySectionExtra
  originalTotalOutflow: number
  currentTotalOutflow: number
  netOutflowSaved: number
}
