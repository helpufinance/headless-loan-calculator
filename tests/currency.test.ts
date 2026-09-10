import { describe, expect, it } from 'vitest'
import {
  CURRENCY_CONFIG,
  formatCurrency,
  getCurrenciesByRegion,
  getCurrencyConfig,
  getSupportedCurrencies,
} from '../src/currency'
describe('formatCurrency', () => {
  it('should format USD correctly', () => {
    expect(formatCurrency('USD', 1234.56)).toBe('$1,234.56')
    expect(formatCurrency('USD', 1000000)).toBe('$1,000,000')
    expect(formatCurrency('USD', 99.99)).toBe('$99.99')
  })
  it('should format EUR correctly', () => {
    expect(formatCurrency('EUR', 1234.56)).toBe('1 234,56 €')
    expect(formatCurrency('EUR', 1000000)).toBe('1 000 000 €')
  })
  it('should format HUF correctly (no decimals)', () => {
    expect(formatCurrency('HUF', 123456)).toBe('123 456 Ft')
    expect(formatCurrency('HUF', 1234567.89)).toBe('1 234 568 Ft')
  })
  it('should format JPY correctly (no decimals)', () => {
    expect(formatCurrency('JPY', 12345)).toBe('¥12,345')
  })
  it('should format GBP correctly', () => {
    expect(formatCurrency('GBP', 1234.56)).toBe('£1,234.56')
  })
  it('should handle zero amounts', () => {
    expect(formatCurrency('USD', 0)).toBe('$0')
    expect(formatCurrency('EUR', 0)).toBe('0 €')
  })
  it('should handle large numbers', () => {
    expect(formatCurrency('USD', 1234567890.12)).toBe('$1,234,567,890.12')
  })
})
describe('getCurrencyConfig', () => {
  it('should return correct config for USD', () => {
    const config = getCurrencyConfig('USD')
    expect(config.symbol).toBe('$')
    expect(config.position).toBe('before')
    expect(config.decimalPlaces).toBe(2)
  })
  it('should return correct config for EUR', () => {
    const config = getCurrencyConfig('EUR')
    expect(config.symbol).toBe('€')
    expect(config.position).toBe('after')
    expect(config.thousandsSeparator).toBe(' ')
    expect(config.decimalSeparator).toBe(',')
  })
})
describe('getSupportedCurrencies', () => {
  it('should return all supported currencies', () => {
    const currencies = getSupportedCurrencies()
    expect(currencies).toContain('USD')
    expect(currencies).toContain('EUR')
    expect(currencies).toContain('GBP')
    expect(currencies).toContain('HUF')
    expect(currencies.length).toBe(Object.keys(CURRENCY_CONFIG).length)
  })
})
describe('getCurrenciesByRegion', () => {
  it('should return European currencies', () => {
    const currencies = getCurrenciesByRegion('Europe')
    expect(currencies).toContain('EUR')
    expect(currencies).toContain('GBP')
    expect(currencies).toContain('CHF')
    expect(currencies).toContain('HUF')
    expect(currencies).not.toContain('USD')
  })
  it('should return American currencies', () => {
    const currencies = getCurrenciesByRegion('Americas')
    expect(currencies).toContain('USD')
    expect(currencies).toContain('CAD')
    expect(currencies).toContain('BRL')
    expect(currencies).not.toContain('EUR')
  })
  it('should return Asian currencies', () => {
    const currencies = getCurrenciesByRegion('Asia')
    expect(currencies).toContain('JPY')
    expect(currencies).toContain('CNY')
    expect(currencies).toContain('SGD')
  })
})
