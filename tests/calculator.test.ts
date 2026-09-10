import { describe, expect, it } from 'vitest'
import {
  calculateAffordableLoan,
  calculateLoan,
  calculateMonthlyPayment,
  calculateTotalInterest,
  getVatRate,
  validateInput,
} from '../src/calculator'
import * as publicApi from '../src'
import type { LoanCalculationInput } from '../src/types'
describe('calculateMonthlyPayment', () => {
  it('should calculate monthly payment correctly for standard loan', () => {
    const principal = 10000
    const monthlyRate = 0.06 / 12
    const termMonths = 60
    const payment = calculateMonthlyPayment(principal, monthlyRate, termMonths)
    expect(payment).toBeCloseTo(193.33, 1)
  })
  it('should handle 0% interest rate', () => {
    const principal = 12000
    const monthlyRate = 0
    const termMonths = 12
    const payment = calculateMonthlyPayment(principal, monthlyRate, termMonths)
    expect(payment).toBe(1000)
  })
  it('should handle high interest rates', () => {
    const principal = 5000
    const monthlyRate = 0.02
    const termMonths = 24
    const payment = calculateMonthlyPayment(principal, monthlyRate, termMonths)
    expect(payment).toBeGreaterThan(260)
    expect(payment).toBeLessThan(270)
  })
})
describe('calculateAffordableLoan', () => {
  it('should calculate affordable loan amount correctly', () => {
    const monthlyPayment = 500
    const monthlyRate = 0.005
    const termMonths = 60
    const maxLoan = calculateAffordableLoan(monthlyPayment, monthlyRate, termMonths)
    expect(maxLoan).toBeCloseTo(25862, -1)
  })
  it('should handle 0% interest rate', () => {
    const monthlyPayment = 500
    const monthlyRate = 0
    const termMonths = 24
    const maxLoan = calculateAffordableLoan(monthlyPayment, monthlyRate, termMonths)
    expect(maxLoan).toBe(12000)
  })
})
describe('calculateTotalInterest', () => {
  it('should calculate total interest correctly', () => {
    const principal = 10000
    const monthlyPayment = 193.33
    const termMonths = 60
    const totalInterest = calculateTotalInterest(principal, monthlyPayment, termMonths)
    expect(totalInterest).toBeCloseTo(1599.8, 0)
  })
})
describe('getVatRate', () => {
  it('should return correct VAT rates for known regions', () => {
    expect(getVatRate('EU')).toBe(0.21)
    expect(getVatRate('DE')).toBe(0.19)
    expect(getVatRate('UK')).toBe(0.2)
    expect(getVatRate('HU')).toBe(0.27)
    expect(getVatRate('NoVat')).toBe(0)
  })
  it('should handle custom VAT rate', () => {
    expect(getVatRate('Custom', 15)).toBe(0.15)
    expect(getVatRate('Custom', 25)).toBe(0.25)
  })
  it('should return 0 for unknown region', () => {
    expect(getVatRate('UNKNOWN')).toBe(0)
  })
})
describe('validateInput', () => {
  const validInput: LoanCalculationInput = {
    price: 10000,
    loanTermMonths: 12,
    apr: 10,
    initialPayment: 1000,
    residualValue: 0,
    loanType: 'closed',
    priceMode: 'gross',
    vatRate: 0.21,
  }
  it('should return null for valid input', () => {
    expect(validateInput(validInput)).toBeNull()
  })
  it('should reject invalid price', () => {
    expect(validateInput({ ...validInput, price: 0 })).toEqual({
      code: 'INVALID_PRICE',
      message: 'Price must be a positive number',
      field: 'price',
    })
    expect(validateInput({ ...validInput, price: -100 })).toEqual({
      code: 'INVALID_PRICE',
      message: 'Price must be a positive number',
      field: 'price',
    })
  })
  it('should reject invalid loan term', () => {
    expect(validateInput({ ...validInput, loanTermMonths: 0 })).toEqual({
      code: 'INVALID_TERM',
      message: 'Loan term must be a positive integer (months)',
      field: 'loanTermMonths',
    })
    expect(validateInput({ ...validInput, loanTermMonths: 12.5 })).toEqual({
      code: 'INVALID_TERM',
      message: 'Loan term must be a positive integer (months)',
      field: 'loanTermMonths',
    })
  })
  it('should reject initial payment >= price', () => {
    expect(validateInput({ ...validInput, initialPayment: 10000 })).toEqual({
      code: 'INITIAL_PAYMENT_TOO_HIGH',
      message: 'Initial payment cannot be greater than or equal to the total price',
      field: 'initialPayment',
    })
  })
  it('should reject a negative or invalid APR', () => {
    expect(validateInput({ ...validInput, apr: -1 })?.code).toBe('INVALID_APR')
    expect(validateInput({ ...validInput, apr: NaN })?.code).toBe('INVALID_APR')
  })
  it('should reject residual value >= financed amount for open loans', () => {
    expect(
      validateInput({
        ...validInput,
        loanType: 'open',
        initialPayment: 2000,
        residualValue: 9000,
      }),
    ).toEqual({
      code: 'RESIDUAL_VALUE_TOO_HIGH',
      message: 'Residual value cannot be greater than or equal to the price minus initial payment',
      field: 'residualValue',
    })
  })
})
describe('calculateLoan', () => {
  it('should calculate a basic closed loan correctly', () => {
    const result = calculateLoan({
      price: 10000,
      loanTermMonths: 12,
      apr: 12,
      initialPayment: 0,
      residualValue: 0,
      loanType: 'closed',
      priceMode: 'gross',
      vatRate: 0,
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.totalFinancedAmount).toBe(10000)
    expect(result.data.paymentSchedule).toHaveLength(12)
    expect(result.data.monthlyPayment).toBeGreaterThan(850)
    expect(result.data.monthlyPayment).toBeLessThan(900)
  })
  it('should handle initial payment correctly', () => {
    const result = calculateLoan({
      price: 10000,
      loanTermMonths: 12,
      apr: 12,
      initialPayment: 2000,
      residualValue: 0,
      loanType: 'closed',
      priceMode: 'gross',
      vatRate: 0,
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.totalFinancedAmount).toBe(8000)
    expect(result.data.paymentSchedule).toHaveLength(13)
    expect(result.data.paymentSchedule[0].month).toBe(0)
  })
  it('should handle an initial payment in net price mode', () => {
    const result = calculateLoan({
      price: 10000,
      loanTermMonths: 12,
      apr: 12,
      initialPayment: 2000,
      residualValue: 0,
      loanType: 'closed',
      priceMode: 'net',
      vatRate: 0.21,
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.paymentSchedule[0].grossAmount).toBeCloseTo(2420, 0)
  })
  it('should handle open loan with residual value', () => {
    const result = calculateLoan({
      price: 20000,
      loanTermMonths: 36,
      apr: 8,
      initialPayment: 4000,
      residualValue: 5000,
      loanType: 'open',
      priceMode: 'gross',
      vatRate: 0.21,
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.paymentSchedule).toHaveLength(38)
    const lastPayment = result.data.paymentSchedule[result.data.paymentSchedule.length - 1]
    expect(lastPayment.month).toBe(37)
    expect(lastPayment.principalBalance).toBe(0)
  })
  it('should calculate VAT correctly in gross mode', () => {
    const result = calculateLoan({
      price: 12100,
      loanTermMonths: 12,
      apr: 0,
      initialPayment: 0,
      residualValue: 0,
      loanType: 'closed',
      priceMode: 'gross',
      vatRate: 0.21,
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.totalVatAmount).toBeCloseTo(2100, 0)
  })
  it('should calculate VAT correctly in net mode', () => {
    const result = calculateLoan({
      price: 10000,
      loanTermMonths: 12,
      apr: 0,
      initialPayment: 0,
      residualValue: 0,
      loanType: 'closed',
      priceMode: 'net',
      vatRate: 0.21,
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.totalVatAmount).toBeCloseTo(2100, 0)
  })
  it('should return error for invalid input', () => {
    const result = calculateLoan({
      price: -1000,
      loanTermMonths: 12,
      apr: 10,
      loanType: 'closed',
      priceMode: 'gross',
      vatRate: 0,
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.code).toBe('INVALID_PRICE')
  })
  it('should produce decreasing principal balance', () => {
    const result = calculateLoan({
      price: 10000,
      loanTermMonths: 12,
      apr: 10,
      initialPayment: 0,
      loanType: 'closed',
      priceMode: 'gross',
      vatRate: 0,
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    const schedule = result.data.paymentSchedule
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].principalBalance).toBeLessThan(schedule[i - 1].principalBalance)
    }
    expect(schedule[schedule.length - 1].principalBalance).toBe(0)
  })
})

describe('public exports', () => {
  it('exports VAT rates and currency helpers', () => {
    expect(publicApi.VAT_RATES.EU.rate).toBe(0.21)
    expect(publicApi.formatCurrency('USD', 10)).toBe('$10')
  })
})
