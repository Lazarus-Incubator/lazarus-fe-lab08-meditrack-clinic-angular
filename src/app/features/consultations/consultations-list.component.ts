import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, map, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { DoctorService } from '../../core/services/doctor.service';
import { PatientService } from '../../core/services/patient.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-consultations-list',
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterLink, EmptyStateComponent],
  template: `
    <section class="page">
      <div class="page-title">
        <div>
          <h1>Consultas</h1>
          <p>Citas con triaje completado listas para atencion medica.</p>
        </div>
      </div>
      @if (vm$ | async; as vm) {
        @if (vm.length) {
          <div class="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Paciente</th><th>Motivo</th><th></th></tr></thead>
              <tbody>
                @for (item of vm; track item.appointment.id) {
                  <tr>
                    <td>{{ item.appointment.scheduledAt | date: 'short' }}</td>
                    <td>{{ item.patient }}</td>
                    <td>{{ item.appointment.reason }}</td>
                    <td><a [routerLink]="['/app/consultations', item.appointment.id]">Atender</a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-empty-state title="Sin consultas pendientes" message="No hay citas en TRIAGE_DONE." />
        }
      }
    </section>
  `
})
export class ConsultationsListComponent {
  private readonly appointments = inject(AppointmentService);
  private readonly patients = inject(PatientService);
  private readonly doctors = inject(DoctorService);
  private readonly auth = inject(AuthService);

  readonly vm$ = this.doctors.doctorByUser(this.auth.currentUser()?.id ?? '').pipe(
    switchMap((doctor) =>
      forkJoin({
        doctor: [doctor],
        appointments: this.appointments.list(),
        patients: this.patients.list()
      })
    ),
    map(({ doctor, appointments, patients }) =>
      appointments
        // Resolve actions depending on the current screen context.
        .filter((appointment) => ['TRIAGE_DONE', 'CHECKED_IN'].includes(appointment.status))
        .filter((appointment) =>
          this.auth.currentUser()?.role === 'ADMIN' ? true : appointment.doctorId === doctor?.id
        )
        .map((appointment) => ({
          appointment,
          patient:
            patients.find((patient) => patient.id === appointment.patientId)?.fullName ??
            'Paciente no encontrado'
        }))
    )
  );
}
