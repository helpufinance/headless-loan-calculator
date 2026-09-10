<p align="center">
  <a href="https://github.com/helpufinance/helpu.finance">
    <img src="https://raw.githubusercontent.com/helpufinance/.github/refs/heads/main/profile/assets/helpu_finance.png" alt="HelpU Finance" width="260">
  </a>
</p>

# Headless Loan Calculator

A headless, framework-agnostic loan calculator with support for VAT, multiple currencies, and full amortization schedules. Zero dependencies, works in Node.js, Bun, and browsers.

## What is HelpU Finance?

HelpU Finance is a free, privacy-first platform with financial tools and educational resources. No tracking, no data collection.

We believe that financial literacy should be accessible to everyone.

## Features

- **Full amortization schedule** - Get detailed month-by-month payment breakdown
- **VAT support** - Calculate with net or gross prices, with configurable VAT rates
- **Multi-currency** - Support for 35+ currencies with proper formatting
- **Open & Closed loans** - Support for both traditional loans and balloon payment structures
- **Zero dependencies** - Lightweight and fast
- **TypeScript first** - Full type safety and IntelliSense support
- **Universal** - Works with Node.js, Bun, and in browsers

## Installation

```bash
# npm
npm install @helpu/headless-loan-calculator

# yarn
yarn add @helpu/headless-loan-calculator

# pnpm
pnpm add @helpu/headless-loan-calculator

# bun
bun add @helpu/headless-loan-calculator
```

## Usage

```typescript
import { calculateLoan, formatCurrency } from '@helpu/headless-loan-calculator'

const result = calculateLoan({
  price: 25000,           // Total price
  loanTermMonths: 60,     // 5 years
  apr: 6.5,               // 6.5% APR
  initialPayment: 5000,   // $5,000 down payment
  residualValue: 0,       // No balloon payment
  loanType: 'closed',     // Standard loan
  priceMode: 'gross',     // Price includes VAT
  vatRate: 0.21,          // 21% VAT
})

if (result.success) {
  console.log('Monthly payment:', formatCurrency('USD', result.data.monthlyPayment))
  console.log('Total interest:', formatCurrency('USD', result.data.totalInterestAmount))
  console.log('Total repayment:', formatCurrency('USD', result.data.totalRepayment))
}
```

## API Reference

### `calculateLoan(input)`

Calculate a complete loan with amortization schedule.

```typescript
interface LoanCalculationInput {
  price: number
  loanTermMonths: number
  apr: number
  initialPayment?: number
  residualValue?: number
  loanType: 'closed' | 'open'
  priceMode: 'gross' | 'net'
  vatRate: number
}
```

Returns a result object:

```typescript
interface LoanCalculationResult {
  totalFinancedAmount: number
  totalInterestAmount: number
  totalVatAmount: number
  totalRepayment: number
  monthlyPayment: number
  paymentSchedule: MonthlyPayment[]
  input: LoanCalculationInput
}
```

### `calculateMonthlyPayment(principal, monthlyRate, termMonths)`

Calculate the monthly payment for a loan using the amortization formula.

```typescript
import { calculateMonthlyPayment } from '@helpu/headless-loan-calculator'

const monthlyPayment = calculateMonthlyPayment(
  20000,      // Principal
  0.005,      // Monthly rate (6% APR / 12)
  60          // Term in months
)
```

### `calculateAffordableLoan(monthlyPayment, monthlyRate, termMonths)`

Calculate how much you can borrow based on a desired monthly payment.

```typescript
import { calculateAffordableLoan } from '@helpu/headless-loan-calculator'

const maxLoan = calculateAffordableLoan(
  500,        // Desired monthly payment
  0.005,      // Monthly rate
  60          // Term in months
)
```

### `formatCurrency(currency, amount)`

Format a number as currency with proper locale-specific formatting.

```typescript
import { formatCurrency } from '@helpu/headless-loan-calculator'

formatCurrency('EUR', 1234.56)  // "1 234,56 €"
formatCurrency('USD', 1234.56)  // "$1,234.56"
formatCurrency('HUF', 123456)   // "123 456 Ft"
```

### `getVatRate(vatRateKey, customRate?)`

Get the VAT rate for a specific region.

```typescript
import { getVatRate } from '@helpu/headless-loan-calculator'

getVatRate('EU')              // 0.21 (21%)
getVatRate('DE')              // 0.19 (19%)
getVatRate('Custom', 15)      // 0.15 (15%)
```

## Loan Types

### Closed Loan (Standard)

Traditional loan where the full amount is financed and paid off over the term.

```typescript
const result = calculateLoan({
  price: 30000,
  loanTermMonths: 48,
  apr: 5.9,
  loanType: 'closed',
  priceMode: 'gross',
  vatRate: 0.21,
})
```

### Open Loan (Balloon Payment)

Loan with a residual value that is paid as a lump sum at the end.

```typescript
const result = calculateLoan({
  price: 30000,
  loanTermMonths: 48,
  apr: 5.9,
  residualValue: 10000,  // Balloon payment at end
  loanType: 'open',
  priceMode: 'gross',
  vatRate: 0.21,
})
```

## Price Modes

### Gross Mode (Default)

Use when the price includes VAT. Common for consumer/retail scenarios.

```typescript
const result = calculateLoan({
  price: 12100,
  priceMode: 'gross',
  vatRate: 0.21,
  ...
})
```

### Net Mode

Use when the price excludes VAT. Common for B2B scenarios where VAT can be deducted.

```typescript
const result = calculateLoan({
  price: 10000,
  priceMode: 'net',
  vatRate: 0.21,
  ...
})
```

## Supported Currencies

The library supports 35+ currencies across all regions:

- **Europe**: EUR, GBP, CHF, SEK, NOK, DKK, PLN, CZK, RON, HUF
- **Americas**: USD, CAD, MXN, BRL, ARS, CLP, COP, PEN
- **Asia**: JPY, CNY, HKD, KRW, SGD, INR, THB, MYR, IDR, PHP
- **Middle East & Africa**: AED, SAR, ILS, ZAR
- **Oceania**: AUD, NZD
- **Other**: RUB, TRY

## Error Handling

The library uses a Result type pattern for safe error handling:

```typescript
const result = calculateLoan(input)

if (result.success) {
  console.log(result.data.monthlyPayment)
} else {
  console.error(result.error.code, result.error.message)
}
```

Possible error codes:

- `INVALID_PRICE` - Price must be a positive number
- `INVALID_TERM` - Loan term must be a positive integer
- `INVALID_APR` - APR must be a non-negative number
- `INITIAL_PAYMENT_TOO_HIGH` - Initial payment exceeds price
- `RESIDUAL_VALUE_TOO_HIGH` - Residual value exceeds financed amount

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  LoanCalculationInput,
  LoanCalculationResult,
  MonthlyPayment,
  Currency,
  LoanType,
  PriceMode,
} from '@helpu/headless-loan-calculator'
```

## Testing

Install the repository dependencies and run the test suite with:

```bash
npm test
```

## Contributing

Contributions are welcome. Please read the [contribution guidelines](https://docs.omisai.com/contribution-guidelines) before opening a pull request.

## Sponsor

Support HelpU Finance through [GitHub Sponsors](https://github.com/sponsors/helpufinance).

## License

This project is available for permitted non-commercial use under the **PolyForm Noncommercial License 1.0.0**.

Personal learning, education, research, experimentation, and other uses permitted by the PolyForm Noncommercial License are welcome.

**Commercial use requires a separate license from Omisai Technologies.**

Commercial licensing helps fund the HelpU Finance mission of creating freely accessible financial tools, educational resources, and technology.

For commercial licensing, see [`COMMERCIAL-LICENSING.md`](./COMMERCIAL-LICENSING.md).

Copyright (c) 2026 Omisai Technologies.

HelpU Finance is a project and brand of Omisai Technologies.
