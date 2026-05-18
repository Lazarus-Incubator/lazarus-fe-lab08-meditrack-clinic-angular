import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import {
  Appointment,
  BillingRecord,
  Consultation,
  LabOrder,
  LabPriority,
  Medication,
  Prescription,
  PrescriptionItem,
  User
} from '../models/domain.models';
import { nowIso } from '../../shared/utils/format.utils';
import { ApiService } from './api.service';
import { AppointmentService } from './appointment.service';
import { AuditLogService } from './audit-log.service';
import { IdService } from './id.service';

export interface ConsultationInput {
  reason: string;
  clinicalNotes: string;
  preliminaryDiagnosis: string;
  treatmentPlan: string;
  labOrders: { testName: string; priority: LabPriority }[];
  prescriptionItems: PrescriptionItem[];
}

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private readonly api = inject(ApiService);
  private readonly ids = inject(IdService);
  private readonly appointments = inject(AppointmentService);
  private readonly audit = inject(AuditLogService);

  list(): Observable<Consultation[]> {
    return this.api.get<Consultation[]>('consultations');
  }

  byAppointment(appointmentId: string): Observable<Consultation[]> {
    return this.api.get<Consultation[]>('consultations', { appointmentId });
  }

  finish(appointment: Appointment, input: ConsultationInput, user: User): Observable<Consultation> {
    const consultation: Consultation = {
      id: this.ids.next('con'),
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      reason: input.reason,
      clinicalNotes: input.clinicalNotes,
      preliminaryDiagnosis: input.preliminaryDiagnosis,
      treatmentPlan: input.treatmentPlan,
      status: 'COMPLETED',
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    return this.api.post<Consultation>('consultations', consultation).pipe(
      switchMap((saved) =>
        forkJoin([
          this.createLabOrders(saved, appointment, input.labOrders),
          this.createPrescription(saved, appointment, input.prescriptionItems),
          this.createBilling(saved, appointment, input)
        ]).pipe(map(() => saved))
      ),
      // Billing can be prepared immediately after the consultation.
      switchMap((saved) =>
        this.appointments
          .transition(appointment, 'PENDING_PAYMENT', user, 'Consulta finalizada')
          .pipe(map(() => saved))
      ),
      switchMap((saved) =>
        this.audit
          .create('Consultation', saved.id, 'COMPLETE', 'Consulta completada', user)
          .pipe(map(() => saved))
      )
    );
  }

  private createLabOrders(
    consultation: Consultation,
    appointment: Appointment,
    orders: { testName: string; priority: LabPriority }[]
  ): Observable<LabOrder[]> {
    if (orders.length === 0) {
      return of([]);
    }
    const requests = orders.map((order) => {
      const labOrder: LabOrder = {
        id: this.ids.next('lab'),
        appointmentId: appointment.id,
        consultationId: consultation.id,
        doctorId: appointment.doctorId,
        testName: order.testName,
        priority: order.priority,
        status: 'PENDING',
        requestedAt: nowIso()
      };
      return this.api.post<LabOrder>('labOrders', labOrder);
    });
    return forkJoin(requests);
  }

  private createPrescription(
    consultation: Consultation,
    appointment: Appointment,
    items: PrescriptionItem[]
  ): Observable<Prescription | null> {
    if (items.length === 0) {
      return of(null);
    }
    const prescription: Prescription = {
      id: this.ids.next('rx'),
      appointmentId: appointment.id,
      consultationId: consultation.id,
      doctorId: appointment.doctorId,
      status: 'PENDING',
      items,
      createdAt: nowIso()
    };
    return this.api.post<Prescription>('prescriptions', prescription);
  }

  private createBilling(
    _consultation: Consultation,
    appointment: Appointment,
    input: ConsultationInput
  ): Observable<BillingRecord> {
    return this.api.get<Medication[]>('medications').pipe(
      map((medications) => {
        const medicationAmount = input.prescriptionItems.reduce((total, item) => {
          const medication = medications.find((candidate) => candidate.id === item.medicationId);
          return total + (medication?.unitPrice ?? 0) * item.quantity;
        }, 0);
        const labAmount = input.labOrders.length * 35;
        const total = 80 + labAmount + medicationAmount;
        return {
          id: this.ids.next('bill'),
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          consultationAmount: 80,
          labAmount,
          medicationAmount,
          discount: 0,
          total,
          paidAmount: 0,
          status: 'PENDING' as const,
          createdAt: nowIso()
        };
      }),
      switchMap((billing) => this.api.post<BillingRecord>('billingRecords', billing))
    );
  }
}
