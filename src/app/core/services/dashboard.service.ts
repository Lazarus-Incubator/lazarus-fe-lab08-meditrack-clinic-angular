import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, shareReplay } from 'rxjs';
import { Appointment, AuditLog, BillingRecord, LabOrder, Patient, Prescription, Role } from '../models/domain.models';
import { todayInputValue } from '../../shared/utils/format.utils';
import { ApiService } from './api.service';

export interface DashboardCard {
  label: string;
  value: number;
  tone: 'primary' | 'info' | 'warning' | 'success';
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);
  private cachedSummary$?: Observable<DashboardCard[]>;

  cardsForRole(role: Role): Observable<DashboardCard[]> {
    if (this.cachedSummary$) {
      return this.cachedSummary$;
    }

    // Dashboard summaries can be reused during the session.
    this.cachedSummary$ = forkJoin({
      patients: this.api.get<Patient[]>('patients'),
      appointments: this.api.get<Appointment[]>('appointments'),
      labOrders: this.api.get<LabOrder[]>('labOrders'),
      prescriptions: this.api.get<Prescription[]>('prescriptions'),
      billing: this.api.get<BillingRecord[]>('billingRecords'),
      audit: this.api.get<AuditLog[]>('auditLogs')
    }).pipe(
      map(({ patients, appointments, labOrders, prescriptions, billing, audit }) => {
        const today = todayInputValue();
        const todayAppointments = appointments.filter((item) => item.scheduledAt.startsWith(today));
        const pendingCare = appointments.filter((item) =>
          ['CHECKED_IN', 'TRIAGE_DONE', 'IN_CONSULTATION', 'PENDING_PAYMENT'].includes(item.status)
        );
        const roleCards: Record<Role, DashboardCard[]> = {
          ADMIN: [
            this.card('Total de pacientes', patients.length, 'primary'),
            this.card('Citas de hoy', todayAppointments.length, 'info'),
            this.card('Atenciones pendientes', pendingCare.length, 'warning'),
            this.card('Laboratorios pendientes', labOrders.filter((o) => o.status === 'PENDING').length, 'warning'),
            this.card('Recetas pendientes', prescriptions.filter((p) => p.status === 'PENDING').length, 'warning'),
            this.card('Pagos pendientes', billing.filter((b) => b.status !== 'PAID').length, 'warning')
          ],
          RECEPCION: [
            this.card('Citas de hoy', todayAppointments.length, 'info'),
            this.card('Pacientes registrados', patients.length, 'primary'),
            this.card('Pendientes check-in', appointments.filter((a) => a.status === 'SCHEDULED').length, 'warning'),
            this.card('Citas canceladas', appointments.filter((a) => a.status === 'CANCELLED').length, 'info')
          ],
          ENFERMERIA: [
            this.card('Pendientes de triaje', appointments.filter((a) => a.status === 'CHECKED_IN').length, 'warning'),
            this.card('Triajes completados hoy', appointments.filter((a) => a.status === 'TRIAGE_DONE' && a.updatedAt.startsWith(today)).length, 'success')
          ],
          MEDICO: [
            this.card('Citas asignadas hoy', todayAppointments.length, 'info'),
            this.card('Consultas pendientes', appointments.filter((a) => a.status === 'TRIAGE_DONE').length, 'warning'),
            this.card('Labs pendientes', labOrders.filter((o) => o.status === 'PENDING').length, 'warning')
          ],
          LABORATORIO: [
            this.card('Ordenes pendientes', labOrders.filter((o) => o.status === 'PENDING').length, 'warning'),
            this.card('Ordenes completadas hoy', labOrders.filter((o) => o.status === 'COMPLETED' && o.completedAt?.startsWith(today)).length, 'success')
          ],
          FARMACIA: [
            this.card('Recetas pendientes', prescriptions.filter((p) => p.status === 'PENDING').length, 'warning'),
            this.card('Medicamentos bajo stock', 0, 'info')
          ],
          CAJA: [
            this.card('Pagos pendientes', billing.filter((b) => b.status !== 'PAID').length, 'warning'),
            this.card('Pagos registrados hoy', billing.filter((b) => b.paidAt?.startsWith(today)).length, 'success')
          ],
          AUDITOR: [
            this.card('Eventos recientes', audit.slice(-10).length, 'primary'),
            this.card('Modulos auditados', new Set(audit.map((item) => item.entityType)).size, 'info')
          ]
        };
        return roleCards[role];
      })
    ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

    return this.cachedSummary$;
  }

  private card(
    label: string,
    value: number,
    tone: DashboardCard['tone']
  ): DashboardCard {
    return { label, value, tone };
  }
}
