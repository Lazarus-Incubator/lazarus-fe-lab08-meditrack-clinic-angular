import { BillingRecord } from '../models/domain.models';

export function calculateBillingBalance(record: Pick<BillingRecord, 'total' | 'paidAmount'>): number {
  return Math.max(0, Number((record.total - record.paidAmount).toFixed(2)));
}

export function calculateBillingStatus(record: Pick<BillingRecord, 'total' | 'paidAmount'>) {
  if (record.paidAmount <= 0) {
    return 'PENDING' as const;
  }

  return record.paidAmount >= record.total ? ('PAID' as const) : ('PARTIAL' as const);
}
