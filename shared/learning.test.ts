import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bondPrice, compoundInvestment, feeProjection, purchasingPower, stockPrice, weightedPortfolioReturn } from './learning.ts';

function close(actual: number, expected: number, tolerance = 1e-7): void {
  assert.ok(Math.abs(actual - expected) < tolerance, `Expected ${expected}, received ${actual}`);
}

test('inflation reduces purchasing power without reducing the nominal cash balance', () => {
  const points = purchasingPower(10000, 3, 10);
  close(points.at(-1)!.balance, 10000 / 1.03 ** 10);
  assert.equal(points.at(-1)!.contributions, 10000);
  assert.equal(purchasingPower(10000, 0, 10).at(-1)!.balance, 10000);
});

test('monthly compounding preserves the entered effective annual return', () => {
  close(compoundInvestment(10000, 0, 7, 20).at(-1)!.balance, 10000 * 1.07 ** 20);
});

test('monthly deposits arrive after the monthly return and zero returns preserve all contributions', () => {
  const rate = 1.06 ** (1 / 12) - 1;
  const expected = 1000 * 1.06 + 100 * ((1 + rate) ** 12 - 1) / rate;
  close(compoundInvestment(1000, 100, 6, 1).at(-1)!.balance, expected);
  assert.deepEqual(compoundInvestment(1000, 100, 0, 3).at(-1), { year: 3, balance: 4600, contributions: 4600 });
});

test('negative investment returns may leave the balance below contributions', () => {
  const result = compoundInvestment(1000, 100, -10, 5).at(-1)!;
  assert.ok(result.balance < result.contributions);
  assert.ok(result.balance > 0);
});

test('a bond trades at par when its market yield matches its coupon', () => {
  close(bondPrice(1000, 4, 4, 2), 1000);
  close(bondPrice(1000, 4, 4, 10), 1000);
  close(bondPrice(1000, 4, 0, 2), 1080);
});

test('higher yields lower bond prices and affect a longer maturity more', () => {
  const short = bondPrice(1000, 4, 6, 2);
  const long = bondPrice(1000, 4, 6, 10);
  close(short, 40 / 1.06 + 1040 / 1.06 ** 2);
  assert.ok(long < short && short < 1000);
  assert.ok(bondPrice(1000, 4, 2, 10) > bondPrice(1000, 4, 2, 2));
});

test('a lower earnings multiple can offset earnings growth', () => {
  assert.equal(stockPrice(5, 20), 100);
  assert.equal(stockPrice(5.5, 20), 110);
  assert.equal(stockPrice(6, 15), 90);
});

test('fees apply to the balance after gross return, with the difference compounded over time', () => {
  close(feeProjection(10000, 6, 2, 1).at(-1)!.balance, 10388);
  close(feeProjection(10000, 6, 2, 20).at(-1)!.balance, 10000 * (1.06 * 0.98) ** 20);
  assert.ok(feeProjection(10000, 6, 0.2, 20).at(-1)!.balance > feeProjection(10000, 6, 2, 20).at(-1)!.balance);
});

test('portfolio scenario weights total 100% and jointly falling assets can produce a loss', () => {
  close(weightedPortfolioReturn({ stocks: 60, bonds: 30, cash: 10 }, { stocks: -25, bonds: -12, cash: 2 }), -18.4);
  close(weightedPortfolioReturn({ stocks: 0, bonds: 0, cash: 100 }, { stocks: -25, bonds: -12, cash: 2 }), 2);
  assert.throws(() => weightedPortfolioReturn({ stocks: 60, bonds: 50, cash: 0 }, { stocks: 5, bonds: 2, cash: 1 }), RangeError);
});

test('nonfinite rates, impossible losses, and invalid horizons are rejected', () => {
  assert.throws(() => purchasingPower(100, NaN, 10), RangeError);
  assert.throws(() => compoundInvestment(100, 10, -100, 10), RangeError);
  assert.throws(() => bondPrice(1000, 4, -100, 2), RangeError);
  assert.throws(() => feeProjection(1000, 6, 100, 10), RangeError);
  assert.throws(() => purchasingPower(100, 3, 0), RangeError);
  assert.throws(() => compoundInvestment(100, 10, 6, 1.5), RangeError);
});
