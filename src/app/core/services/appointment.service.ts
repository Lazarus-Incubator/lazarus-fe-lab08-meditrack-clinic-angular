import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { Appointment, AppointmentStatus, User } from '../models/domain.models';
import { nowIso } from '../../shared/utils/format.utils';
import { ApiService } from './api.service';
import { AuditLogService } from './audit-log.service';
import { IdService } from './id.service';

export interface AppointmentFilters {
  date?: string;
  status?: string;
  doctorId?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly api = inject(ApiService);
  private readonly ids = inject(IdService);
  private readonly audit = inject(AuditLogService);

  list(filters: AppointmentFilters = {}): Observable<Appointment[]> {
    return this.api.get<Appointment[]>('appointments').pipe(
      map((appointments) =>
        appointments
          .filter((appointment) =>
            filters.date ? appointment.scheduledAt.startsWith(filters.date) : true
          )
          .filter((appointment) => (filters.status ? appointment.status === filters.status : true))
          .filter((appointment) =>
            filters.doctorId ? appointment.doctorId === filters.doctorId : true
          )
          .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      )
    );
  }

  get(id: string): Observable<Appointment> {
    return this.api.get<Appointment>(`appointments/${id}`);
  }

  byPatient(patientId: string): Observable<Appointment[]> {
    return this.api.get<Appointment[]>('appointments', { patientId }).pipe(
      map((appointments) => appointments.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)))
    );
  }

  hasDoctorConflict(doctorId: string, scheduledAt: string): Observable<boolean> {
    // Compare appointments inside the same working day.
    return this.api.get<Appointment[]>('appointments', { doctorId, scheduledAt: scheduledAt.slice(0, 16) }).pipe(
      map((appointments) =>
        appointments.some((appointment) => !['CANCELLED', 'NO_SHOW'].includes(appointment.status))
      )
    );
  }

  create(
    input: Pick<Appointment, 'patientId' | 'doctorId' | 'specialtyId' | 'scheduledAt' | 'reason'>,
    user: User
  ): Observable<Appointment> {
    const appointment: Appointment = {
      ...input,
      id: this.ids.next('app'),
      status: 'SCHEDULED',
      createdByUserId: user.id,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    return this.api.post<Appointment>('appointments', appointment).pipe(
      switchMap((saved) =>
        this.audit
          .create('Appointment', saved.id, 'CREATE', 'Cita creada', user)
          .pipe(map(() => saved))
      )
    );
  }

  transition(
    appointment: Appointment,
    status: AppointmentStatus,
    user: User,
    description: string
  ): Observable<Appointment> {
    const patch: Partial<Appointment> = {
      status,
      updatedAt: nowIso(),
      checkedInAt: status === 'CHECKED_IN' ? nowIso() : appointment.checkedInAt
    };

    return this.api.patch<Appointment>('appointments', appointment.id, patch).pipe(
      switchMap((saved) =>
        this.audit
          .create('Appointment', saved.id, 'STATUS_CHANGE', description, user)
          .pipe(map(() => saved))
      )
    );
  }
}
