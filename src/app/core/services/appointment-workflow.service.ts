import { Injectable } from '@angular/core';
import {
  Appointment,
  AppointmentAction,
  AppointmentStatus,
  Role,
  User
} from '../models/domain.models';

const FINAL_STATUSES: AppointmentStatus[] = ['CANCELLED', 'NO_SHOW', 'CLOSED'];

@Injectable({ providedIn: 'root' })
export class AppointmentWorkflowService {
  getAvailableAppointmentActions(appointment: Appointment, user: User | null): AppointmentAction[] {
    if (!user || FINAL_STATUSES.includes(appointment.status)) {
      return [];
    }

    const actions: AppointmentAction[] = [];
    if (this.canTransition(appointment, 'CHECKED_IN', user)) {
      actions.push({ key: 'CHECK_IN', label: 'Hacer check-in' });
    }
    if (this.canCancel(appointment, user)) {
      actions.push({ key: 'CANCEL', label: 'Cancelar' });
    }
    if (appointment.status === 'CHECKED_IN' && this.hasRole(user.role, ['ADMIN', 'ENFERMERIA'])) {
      actions.push({
        key: 'TRIAGE',
        label: 'Registrar triaje',
        route: ['/app/triage', appointment.id]
      });
    }
    if (appointment.status === 'TRIAGE_DONE' && this.hasRole(user.role, ['ADMIN', 'MEDICO'])) {
      actions.push({
        key: 'START_CONSULTATION',
        label: 'Iniciar consulta',
        route: ['/app/consultations', appointment.id]
      });
    }
    if (appointment.status === 'PENDING_PAYMENT' && this.hasRole(user.role, ['ADMIN', 'CAJA'])) {
      actions.push({ key: 'BILLING', label: 'Ir a cobro', route: ['/app/billing', appointment.id] });
    }
    if (appointment.status === 'PAID' && this.hasRole(user.role, ['ADMIN', 'CAJA'])) {
      actions.push({ key: 'CLOSE', label: 'Cerrar atencion' });
    }

    return actions;
  }

  canTransition(appointment: Appointment, targetStatus: AppointmentStatus, user: User | null): boolean {
    if (!user || user.role === 'AUDITOR' || FINAL_STATUSES.includes(appointment.status)) {
      return false;
    }

    const key = `${appointment.status}->${targetStatus}`;
    const allowed: Record<string, Role[]> = {
      'SCHEDULED->CHECKED_IN': ['ADMIN', 'RECEPCION'],
      'CHECKED_IN->TRIAGE_DONE': ['ADMIN', 'ENFERMERIA'],
      'TRIAGE_DONE->IN_CONSULTATION': ['ADMIN', 'MEDICO'],
      'IN_CONSULTATION->PENDING_PAYMENT': ['ADMIN', 'MEDICO'],
      'DOCTOR_COMPLETED->PENDING_PAYMENT': ['ADMIN', 'MEDICO'],
      'PENDING_PAYMENT->PAID': ['ADMIN', 'CAJA'],
      'PAID->CLOSED': ['ADMIN', 'CAJA']
    };

    return allowed[key]?.includes(user.role) ?? false;
  }

  canCancel(appointment: Appointment, user: User | null): boolean {
    return (
      !!user &&
      this.hasRole(user.role, ['ADMIN', 'RECEPCION']) &&
      ['SCHEDULED', 'CHECKED_IN'].includes(appointment.status)
    );
  }

  isFinal(status: AppointmentStatus): boolean {
    return FINAL_STATUSES.includes(status);
  }

  private hasRole(role: Role, roles: Role[]): boolean {
    return roles.includes(role);
  }
}
