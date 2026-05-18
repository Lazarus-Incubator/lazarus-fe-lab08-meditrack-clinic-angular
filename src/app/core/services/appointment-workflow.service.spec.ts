import { TestBed } from '@angular/core/testing';
import { Appointment } from '../models/domain.models';
import { AppointmentWorkflowService } from './appointment-workflow.service';

describe('AppointmentWorkflowService', () => {
  const appointment: Appointment = {
    id: 'a-test',
    patientId: 'p-test',
    doctorId: 'd-test',
    specialtyId: 's-test',
    scheduledAt: '2026-05-19T10:00:00.000Z',
    reason: 'Control',
    status: 'SCHEDULED',
    createdByUserId: 'u-test',
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z'
  };

  it('valida una transicion basica por rol', () => {
    const service = TestBed.inject(AppointmentWorkflowService);

    expect(
      service.canTransition(appointment, 'CHECKED_IN', {
        id: 'u-rec',
        fullName: 'Recepcion',
        email: 'recepcion@meditrack.pe',
        password: 'Admin123*',
        role: 'RECEPCION',
        active: true
      })
    ).toBe(true);
  });
});
