import type {
  LoanCalculationError,
  LoanCalculationInput,
  LoanCalculationResult,
  LoanCalculationResultOrError,
  MonthlyPayment,
} from './types'
export function validateInput(input: LoanCalculationInput): LoanCalculationError | null {
  const { price, loanTermMonths, apr, initialPayment = 0, residualValue = 0, loanType } = input
  if (typeof price !== 'number' || isNaN(price) || price <= 0) {
    return {
      code: 'INVALID_PRICE',
      message: 'Price must be a positive number',
      field: 'price',
    }
  }
  if (
    typeof loanTermMonths !== 'number' ||
    isNaN(loanTermMonths) ||
    loanTermMonths <= 0 ||
    !Number.isInteger(loanTermMonths)
  ) {
    return {
      code: 'INVALID_TERM',
      message: 'Loan term must be a positive integer (months)',
      field: 'loanTermMonths',
    }
  }
  if (typeof apr !== 'number' || isNaN(apr) || apr < 0) {
    return {
      code: 'INVALID_APR',
      message: 'APR must be a non-negative number',
      field: 'apr',
    }
  }
  if (initialPayment >= price) {
    return {
      code: 'INITIAL_PAYMENT_TOO_HIGH',
      message: 'Initial payment cannot be greater than or equal to the total price',
      field: 'initialPayment',
    }
  }
  const effectiveResidualValue = loanType === 'open' ? residualValue : 0
  if (effectiveResidualValue >= price - initialPayment) {
    return {
      code: 'RESIDUAL_VALUE_TOO_HIGH',
      message: 'Residual value cannot be greater than or equal to the price minus initial payment',
      field: 'residualValue',
    }
  }
  return null
}
export function calculateMonthlyPayment(
  principal: number,
  monthlyRate: number,
  termMonths: number,
): number {
  if (monthlyRate === 0) {
    return principal / termMonths
  }
  const factor = Math.pow(1 + monthlyRate, termMonths)
  return (principal * (monthlyRate * factor)) / (factor - 1)
}
export function calculateLoan(input: LoanCalculationInput): LoanCalculationResultOrError {
  const validationError = validateInput(input)
  if (validationError) {
    return { success: false, error: validationError }
  }
  const {
    price,
    loanTermMonths,
    apr,
    initialPayment = 0,
    residualValue: inputResidualValue = 0,
    loanType,
    priceMode,
    vatRate,
  } = input
  const residualValue = loanType === 'open' ? inputResidualValue : 0
  let netAmount: number
  let grossAmount: number
  if (priceMode === 'gross') {
    grossAmount = price
    netAmount = grossAmount / (1 + vatRate)
  } else {
    netAmount = price
    grossAmount = netAmount * (1 + vatRate)
  }
  let initialPaymentGross: number
  let initialPaymentNet: number
  if (priceMode === 'gross') {
    initialPaymentGross = initialPayment
    initialPaymentNet = initialPaymentGross / (1 + vatRate)
  } else {
    initialPaymentNet = initialPayment
    initialPaymentGross = initialPaymentNet * (1 + vatRate)
  }
  let residualValueGross: number
  let residualValueNet: number
  if (priceMode === 'gross') {
    residualValueGross = residualValue
    residualValueNet = residualValueGross / (1 + vatRate)
  } else {
    residualValueNet = residualValue
    residualValueGross = residualValueNet * (1 + vatRate)
  }
  const vatOnInitialPayment = initialPaymentGross - initialPaymentNet
  const vatOnResidualValue = residualValueGross - residualValueNet
  const vatOnFinancedAmount = grossAmount - netAmount - vatOnInitialPayment - vatOnResidualValue
  const totalVatAmount = vatOnInitialPayment + vatOnResidualValue + vatOnFinancedAmount
  const financedGrossAmount = grossAmount - initialPaymentGross
  const financedNetAmount =
    loanType === 'closed'
      ? netAmount - initialPaymentNet
      : netAmount - initialPaymentNet - residualValueNet
  const monthlyInterestRate = apr / 12 / 100
  const principalForCalc = priceMode === 'net' ? financedNetAmount : financedGrossAmount
  const monthlyPaymentNet = calculateMonthlyPayment(
    principalForCalc,
    monthlyInterestRate,
    loanTermMonths,
  )
  const monthlyPaymentForCalc =
    priceMode === 'net' ? monthlyPaymentNet : monthlyPaymentNet / (1 + vatRate)
  const payments: MonthlyPayment[] = []
  let totalInterestAmount = 0
  let remainingGrossBalance: number
  let remainingNetBalance: number
  if (loanType === 'closed') {
    remainingGrossBalance = grossAmount - initialPaymentGross
    remainingNetBalance = netAmount - initialPaymentNet
  } else {
    remainingGrossBalance = grossAmount - initialPaymentGross - residualValueGross
    remainingNetBalance = netAmount - initialPaymentNet - residualValueNet
  }
  const totalFinancedAmount = priceMode === 'gross' ? financedGrossAmount : financedNetAmount
  for (let i = 1; i <= loanTermMonths; i++) {
    const interestPayment =
      priceMode === 'net'
        ? remainingNetBalance * monthlyInterestRate
        : remainingGrossBalance * monthlyInterestRate
    const netPrincipalPayment =
      priceMode === 'net'
        ? monthlyPaymentForCalc - interestPayment
        : monthlyPaymentForCalc - interestPayment / (1 + vatRate)
    remainingNetBalance -= netPrincipalPayment
    const vatPayment = netPrincipalPayment * vatRate
    const grossPrincipalPayment = netPrincipalPayment * (1 + vatRate)
    const grossInterestPayment =
      priceMode === 'net' ? interestPayment * (1 + vatRate) : interestPayment
    remainingGrossBalance -= grossPrincipalPayment
    const monthlyPayment = grossPrincipalPayment + grossInterestPayment
    totalInterestAmount += interestPayment
    payments.push({
      month: i,
      netAmount: parseFloat(netPrincipalPayment.toFixed(2)),
      vatAmount: parseFloat(vatPayment.toFixed(2)),
      grossAmount: parseFloat(grossPrincipalPayment.toFixed(2)),
      interestAmount: parseFloat(interestPayment.toFixed(2)),
      monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
      principalBalance: parseFloat(
        Math.max(0, priceMode === 'net' ? remainingNetBalance : remainingGrossBalance).toFixed(2),
      ),
    })
  }
  if (initialPayment > 0) {
    payments.unshift({
      month: 0,
      netAmount: parseFloat(initialPaymentNet.toFixed(2)),
      vatAmount: parseFloat((initialPaymentNet * vatRate).toFixed(2)),
      grossAmount: parseFloat(initialPaymentGross.toFixed(2)),
      interestAmount: 0,
      monthlyPayment: parseFloat(initialPaymentGross.toFixed(2)),
      principalBalance: parseFloat(
        (priceMode === 'net' ? financedNetAmount : financedGrossAmount).toFixed(2),
      ),
    })
  }
  if (loanType === 'open' && residualValue > 0) {
    payments.push({
      month: loanTermMonths + 1,
      netAmount: parseFloat(residualValueNet.toFixed(2)),
      vatAmount: parseFloat((residualValueNet * vatRate).toFixed(2)),
      grossAmount: parseFloat(residualValueGross.toFixed(2)),
      interestAmount: 0,
      monthlyPayment: parseFloat(residualValueGross.toFixed(2)),
      principalBalance: 0,
    })
  }
  const regularMonthlyPayment = payments.find((p) => p.month === 1)!.monthlyPayment
  const result: LoanCalculationResult = {
    totalFinancedAmount: parseFloat(totalFinancedAmount.toFixed(2)),
    totalInterestAmount: parseFloat(totalInterestAmount.toFixed(2)),
    totalVatAmount: parseFloat(totalVatAmount.toFixed(2)),
    totalRepayment: parseFloat(
      (totalFinancedAmount + totalInterestAmount + residualValue).toFixed(2),
    ),
    monthlyPayment: parseFloat(regularMonthlyPayment.toFixed(2)),
    paymentSchedule: payments,
    input,
  }
  return { success: true, data: result }
}
export function calculateAffordableLoan(
  monthlyPayment: number,
  monthlyRate: number,
  termMonths: number,
): number {
  if (monthlyRate === 0) {
    return monthlyPayment * termMonths
  }
  const factor = Math.pow(1 + monthlyRate, termMonths)
  return (monthlyPayment * (factor - 1)) / (monthlyRate * factor)
}
export function calculateTotalInterest(
  principal: number,
  monthlyPayment: number,
  termMonths: number,
): number {
  return monthlyPayment * termMonths - principal
}
export function getVatRate(vatRateKey: string, customRate?: number): number {
  const VAT_RATES: Record<string, number> = {
    NoVat: 0.0,
    DE: 0.19,
    UK: 0.2,
    FR: 0.2,
    EU: 0.21,
    IT: 0.22,
    ES: 0.21,
    HU: 0.27,
    Custom: 0.0,
  }
  if (vatRateKey === 'Custom' && customRate !== undefined) {
    return customRate / 100
  }
  return VAT_RATES[vatRateKey] ?? 0
}
