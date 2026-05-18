import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap, tap } from 'rxjs';
import { LabOrder, LabResult, User } from '../models/domain.models';
import { nowIso } from '../../shared/utils/format.utils';
import { ApiService } from './api.service';
import { AuditLogService } from './audit-log.service';
import { IdService } from './id.service';

export interface LabFilters {
  status?: string;
  priority?: string;
  patientId?: string;
}

@Injectable({ providedIn: 'root' })
export class LabService {
  private readonly api = inject(ApiService);
  private readonly audit = inject(AuditLogService);
  private readonly ids = inject(IdService);

  list(filters: LabFilters = {}): Observable<LabOrder[]> {
    return this.api.get<LabOrder[]>('labOrders').pipe(
      map((orders) =>
        orders
          .filter((order) => (filters.status ? order.status === filters.status : true))
          .filter((order) => (filters.priority ? order.priority === filters.priority : true))
          .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
      )
    );
  }

  get(id: string): Observable<LabOrder> {
    return this.api.get<LabOrder>(`labOrders/${id}`);
  }

  complete(order: LabOrder, result: string, user: User): Observable<LabOrder> {
    const labResult: LabResult = {
      id: this.ids.next('res'),
      labOrderId: order.id,
      result,
      createdByUserId: user.id,
      createdAt: nowIso()
    };

    return this.api.post<LabResult>('labResults', labResult).pipe(
      switchMap(() =>
        this.api.patch<LabOrder>('labOrders', order.id, {
          status: 'COMPLETED',
          result,
          completedAt: nowIso()
        })
      ),
      // Notify the user after the main operation succeeds.
      tap((saved) =>
        this.audit.create('LabOrder', saved.id, 'COMPLETE', 'Resultado de laboratorio registrado', user).subscribe()
      )
    );
  }
}
