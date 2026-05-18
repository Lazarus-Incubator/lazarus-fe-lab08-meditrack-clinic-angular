import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { Medication, Prescription, StockMovement, User } from '../models/domain.models';
import { nowIso } from '../../shared/utils/format.utils';
import { ApiService } from './api.service';
import { AuditLogService } from './audit-log.service';
import { IdService } from './id.service';

export interface PrescriptionFilters {
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class PharmacyService {
  private readonly api = inject(ApiService);
  private readonly audit = inject(AuditLogService);
  private readonly ids = inject(IdService);

  prescriptions(filters: PrescriptionFilters = {}): Observable<Prescription[]> {
    return this.api.get<Prescription[]>('prescriptions').pipe(
      map((prescriptions) =>
        prescriptions
          .filter((prescription) =>
            filters.status ? prescription.status === filters.status : true
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      )
    );
  }

  prescription(id: string): Observable<Prescription> {
    return this.api.get<Prescription>(`prescriptions/${id}`);
  }

  medications(): Observable<Medication[]> {
    return this.api.get<Medication[]>('medications');
  }

  dispense(prescription: Prescription, user: User): Observable<Prescription> {
    if (prescription.status !== 'PENDING') {
      return throwError(() => new Error('Solo se pueden despachar recetas pendientes.'));
    }

    return this.medications().pipe(
      switchMap((medications) => {
        const invalidItem = prescription.items.find((item) => {
          const medication = medications.find((candidate) => candidate.id === item.medicationId);
          return !medication || !medication.active || medication.stock < item.quantity;
        });

        if (invalidItem) {
          return throwError(() => new Error('Stock insuficiente o medicamento inactivo.'));
        }

        const updates = prescription.items.map((item, index) => {
          const medication = medications.find((candidate) => candidate.id === item.medicationId);
          if (!medication) {
            return of(null);
          }
          const movement: StockMovement = {
            id: this.ids.next('stk'),
            medicationId: item.medicationId,
            quantity: item.quantity,
            type: 'OUT',
            reason: `Despacho receta ${prescription.id}`,
            createdByUserId: user.id,
            createdAt: nowIso()
          };
          // Stock is updated after the operation completes.
          return forkJoin([
            this.api.patch<Medication>('medications', medication.id, {
              stock: medication.stock - item.quantity
            }),
            // Create stock movements from the current prescription rows.
            index === 0 ? this.api.post<StockMovement>('stockMovements', movement) : of(null)
          ]);
        });

        return forkJoin(updates).pipe(
          switchMap(() =>
            this.api.patch<Prescription>('prescriptions', prescription.id, {
              status: 'DISPENSED',
              dispensedAt: nowIso()
            })
          )
        );
      }),
      switchMap((saved) =>
        this.audit
          .create('Prescription', saved.id, 'DISPENSE', 'Receta despachada', user)
          .pipe(map(() => saved))
      )
    );
  }
}
