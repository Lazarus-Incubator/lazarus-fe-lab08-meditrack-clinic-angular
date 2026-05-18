import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { Appointment, TriageRecord, User } from '../models/domain.models';
import { nowIso } from '../../shared/utils/format.utils';
import { ApiService } from './api.service';
import { AppointmentService } from './appointment.service';
import { AuditLogService } from './audit-log.service';
import { IdService } from './id.service';

@Injectable({ providedIn: 'root' })
export class TriageService {
  private readonly api = inject(ApiService);
  private readonly appointments = inject(AppointmentService);
  private readonly audit = inject(AuditLogService);
  private readonly ids = inject(IdService);

  pendingAppointments(): Observable<Appointment[]> {
    return this.appointments.list({ status: 'CHECKED_IN' });
  }

  getByAppointment(appointmentId: string): Observable<TriageRecord[]> {
    return this.api.get<TriageRecord[]>('triageRecords', { appointmentId });
  }

  create(
    appointment: Appointment,
    input: Omit<TriageRecord, 'id' | 'appointmentId' | 'createdByUserId' | 'createdAt'>,
    user: User
  ): Observable<TriageRecord> {
    const record: TriageRecord = {
      ...input,
      id: this.ids.next('tri'),
      appointmentId: appointment.id,
      createdByUserId: user.id,
      createdAt: nowIso()
    };

    return this.api.post<TriageRecord>('triageRecords', record).pipe(
      switchMap((saved) =>
        this.appointments.transition(appointment, 'TRIAGE_DONE', user, 'Triaje registrado').pipe(
          switchMap(() =>
            this.audit
              .create('TriageRecord', saved.id, 'CREATE', 'Registro de triaje creado', user)
              .pipe(map(() => saved))
          )
        )
      )
    );
  }
}
