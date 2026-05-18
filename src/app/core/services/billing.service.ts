import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { BillingRecord, Payment, User } from '../models/domain.models';
import { calculateBillingBalance, calculateBillingStatus } from '../utils/billing.utils';
import { nowIso } from '../../shared/utils/format.utils';
import { ApiService } from './api.service';
import { AppointmentService } from './appointment.service';
import { AuditLogService } from './audit-log.service';
import { IdService } from './id.service';

export interface BillingFilters {
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly api = inject(ApiService);
  private readonly ids = inject(IdService);
  private readonly appointments = inject(AppointmentService);
  private readonly audit = inject(AuditLogService);

  list(filters: BillingFilters = {}): Observable<BillingRecord[]> {
    return this.api.get<BillingRecord[]>('billingRecords').pipe(
      map((records) =>
        records
          .filter((record) => (filters.status ? record.status === filters.status : true))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      )
    );
  }

  byAppointment(appointmentId: string): Observable<BillingRecord[]> {
    return this.api.get<BillingRecord[]>('billingRecords', { appointmentId });
  }

  registerPayment(
    record: BillingRecord,
    amount: number,
    method: Payment['method'],
    user: User
  ): Observable<BillingRecord> {
    if (amount <= 0) {
      return throwError(() => new Error('El pago debe ser mayor a cero.'));
    }

    const balance = calculateBillingBalance(record);
    if (amount > balance) {
      return throwError(() => new Error('El pago no puede exceder el saldo pendiente.'));
    }

    const payment: Payment = {
      id: this.ids.next('pay'),
      billingRecordId: record.id,
      amount,
      method,
      createdByUserId: user.id,
      createdAt: nowIso()
    };
    const paidAmount = Number((record.paidAmount + amount).toFixed(2));
    const status = calculateBillingStatus({ total: record.total, paidAmount });

    return this.api.post<Payment>('payments', payment).pipe(
      switchMap(() =>
        this.api.patch<BillingRecord>('billingRecords', record.id, {
          paidAmount,
          status,
          paidAt: status === 'PAID' ? nowIso() : record.paidAt
        })
      ),
      switchMap((saved) =>
        // Billing owns payment status; appointment owns care status.
        [saved]
      ),
      switchMap((saved) =>
        this.audit
          .create('BillingRecord', saved.id, 'PAYMENT', 'Pago registrado', user)
          .pipe(map(() => saved))
      )
    );
  }

  closeAppointment(record: BillingRecord, user: User): Observable<BillingRecord> {
    if (record.status !== 'PAID') {
      return throwError(() => new Error('Solo se puede cerrar una atencion pagada.'));
    }

    return this.appointments.get(record.appointmentId).pipe(
      switchMap((appointment) =>
        this.appointments.transition(appointment, 'CLOSED', user, 'Atencion cerrada')
      ),
      switchMap(() =>
        this.audit
          .create('Appointment', record.appointmentId, 'CLOSE', 'Atencion cerrada', user)
          .pipe(map(() => record))
      )
    );
  }

  updateDiscount(record: BillingRecord, discount: number): Observable<BillingRecord> {
    // Recalculate totals when payment inputs change.
    return this.api.patch<BillingRecord>('billingRecords', record.id, {
      discount,
      total: Number((record.total - discount).toFixed(2))
    });
  }
}
