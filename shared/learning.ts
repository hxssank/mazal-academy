export interface LearningPoint {
  year: number;
  balance: number;
  contributions: number;
}

function finiteNumber(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number.`);
}

function positiveYears(years: number): void {
  if (!Number.isInteger(years) || years < 1 || years > 100) {
    throw new RangeError('Years must be a whole number between 1 and 100.');
  }
}

export function purchasingPower(amount: number, inflationPercent: number, years: number): LearningPoint[] {
  finiteNumber(amount, 'Amount');
  finiteNumber(inflationPercent, 'Inflation');
  positiveYears(years);
  if (amount < 0 || inflationPercent <= -100) throw new RangeError('Check the amount and inflation rate.');
  return Array.from({ length: years + 1 }, (_, year) => ({
    year,
    balance: amount / (1 + inflationPercent / 100) ** year,
    contributions: amount,
  }));
}

export function compoundInvestment(
  startingAmount: number,
  monthlyContribution: number,
  annualReturnPercent: number,
  years: number,
): LearningPoint[] {
  finiteNumber(startingAmount, 'Starting amount');
  finiteNumber(monthlyContribution, 'Monthly contribution');
  finiteNumber(annualReturnPercent, 'Annual return');
  positiveYears(years);
  if (startingAmount < 0 || monthlyContribution < 0 || annualReturnPercent <= -100) {
    throw new RangeError('Check the starting amount, monthly contribution, and annual return.');
  }
  const monthlyRate = (1 + annualReturnPercent / 100) ** (1 / 12) - 1;
  let balance = startingAmount;
  const points = [{ year: 0, balance, contributions: startingAmount }];
  for (let month = 1; month <= years * 12; month += 1) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    if (month % 12 === 0) {
      points.push({ year: month / 12, balance, contributions: startingAmount + monthlyContribution * month });
    }
  }
  return points;
}

export function bondPrice(faceValue: number, couponPercent: number, marketYieldPercent: number, years: number): number {
  finiteNumber(faceValue, 'Face value');
  finiteNumber(couponPercent, 'Coupon rate');
  finiteNumber(marketYieldPercent, 'Market yield');
  positiveYears(years);
  if (faceValue <= 0 || couponPercent < 0 || marketYieldPercent <= -100) throw new RangeError('Check the bond inputs.');
  const rate = marketYieldPercent / 100;
  const coupon = faceValue * couponPercent / 100;
  let price = 0;
  for (let year = 1; year <= years; year += 1) {
    price += coupon / (1 + rate) ** year;
  }
  return price + faceValue / (1 + rate) ** years;
}

export function stockPrice(earningsPerShare: number, priceEarningsRatio: number): number {
  finiteNumber(earningsPerShare, 'Earnings per share');
  finiteNumber(priceEarningsRatio, 'Price-to-earnings ratio');
  if (earningsPerShare < 0 || priceEarningsRatio < 0) throw new RangeError('Enter nonnegative stock inputs.');
  return earningsPerShare * priceEarningsRatio;
}

export function feeProjection(startingAmount: number, annualReturnPercent: number, annualFeePercent: number, years: number): LearningPoint[] {
  finiteNumber(startingAmount, 'Starting amount');
  finiteNumber(annualReturnPercent, 'Annual return');
  finiteNumber(annualFeePercent, 'Annual fee');
  positiveYears(years);
  if (startingAmount < 0 || annualReturnPercent <= -100 || annualFeePercent < 0 || annualFeePercent >= 100) {
    throw new RangeError('Check the amount, return, and fee.');
  }
  const annualFactor = (1 + annualReturnPercent / 100) * (1 - annualFeePercent / 100);
  return Array.from({ length: years + 1 }, (_, year) => ({ year, balance: startingAmount * annualFactor ** year, contributions: startingAmount }));
}

export interface LearningAllocation { stocks: number; bonds: number; cash: number }

export function weightedPortfolioReturn(allocation: LearningAllocation, returns: LearningAllocation): number {
  const keys = ['stocks', 'bonds', 'cash'] as const;
  for (const key of keys) {
    finiteNumber(allocation[key], `${key} allocation`);
    finiteNumber(returns[key], `${key} return`);
    if (allocation[key] < 0 || allocation[key] > 100 || returns[key] < -100) throw new RangeError('Check the allocation and scenario returns.');
  }
  if (Math.abs(keys.reduce((sum, key) => sum + allocation[key], 0) - 100) > 1e-8) {
    throw new RangeError('The allocation must total 100%.');
  }
  return keys.reduce((total, key) => total + allocation[key] / 100 * returns[key], 0);
}
