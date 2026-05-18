import { calculateBillingBalance } from './billing.utils';

describe('calculateBillingBalance', () => {
  it('calcula el saldo pendiente', () => {
    expect(calculateBillingBalance({ total: 127.5, paidAmount: 50 })).toBe(77.5);
  });
});
