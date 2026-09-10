export const VAT_RATES = {
  NoVat: { rate: 0.0, label: 'No VAT' },
  DE: { rate: 0.19, label: 'Germany (19%)' },
  UK: { rate: 0.2, label: 'UK (20%)' },
  FR: { rate: 0.2, label: 'France (20%)' },
  EU: { rate: 0.21, label: 'EU Standard (21%)' },
  IT: { rate: 0.22, label: 'Italy (22%)' },
  ES: { rate: 0.21, label: 'Spain (21%)' },
  HU: { rate: 0.27, label: 'Hungary (27%)' },
  Custom: { rate: 0.0, label: 'Custom Rate' },
} as const
export type VATRateKey = keyof typeof VAT_RATES
export type PriceMode = 'gross' | 'net'
export type LoanType = 'closed' | 'open'
export type Currency =
  | 'HUF'
  | 'EUR'
  | 'USD'
  | 'GBP'
  | 'JPY'
  | 'CNY'
  | 'AUD'
  | 'CAD'
  | 'CHF'
  | 'NZD'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'SGD'
  | 'HKD'
  | 'KRW'
  | 'MXN'
  | 'BRL'
  | 'INR'
  | 'RUB'
  | 'ZAR'
  | 'PLN'
  | 'TRY'
  | 'AED'
  | 'SAR'
  | 'THB'
  | 'MYR'
  | 'IDR'
  | 'PHP'
  | 'CZK'
  | 'ILS'
  | 'RON'
  | 'CLP'
  | 'ARS'
  | 'COP'
  | 'PEN'
export interface MonthlyPayment {
  month: number
  netAmount: number
  vatAmount: number
  grossAmount: number
  interestAmount: number
  monthlyPayment: number
  principalBalance: number
}
export interface CurrencyConfig {
  symbol: string
  code: string
  name?: string
  position: 'before' | 'after'
  decimalPlaces: number
  thousandsSeparator: string
  decimalSeparator: string
  region?: 'Europe' | 'Americas' | 'Asia' | 'Middle East and Africa' | 'Oceania' | 'Other'
}
export interface LoanCalculationInput {
  price: number
  loanTermMonths: number
  apr: number
  initialPayment?: number
  residualValue?: number
  loanType: LoanType
  priceMode: PriceMode
  vatRate: number
}
export interface LoanCalculationResult {
  totalFinancedAmount: number
  totalInterestAmount: number
  totalVatAmount: number
  totalRepayment: number
  monthlyPayment: number
  paymentSchedule: MonthlyPayment[]
  input: LoanCalculationInput
}
export interface LoanCalculationError {
  code:
    | 'INVALID_PRICE'
    | 'INVALID_TERM'
    | 'INVALID_APR'
    | 'INITIAL_PAYMENT_TOO_HIGH'
    | 'RESIDUAL_VALUE_TOO_HIGH'
    | 'INVALID_INPUT'
  message: string
  field?: string
}
export type LoanCalculationResultOrError =
  | {
      success: true
      data: LoanCalculationResult
    }
  | {
      success: false
      error: LoanCalculationError
    }
