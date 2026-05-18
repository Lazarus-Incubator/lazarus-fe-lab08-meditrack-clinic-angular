import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, map, switchMap } from 'rxjs';
import { PatientService } from '../../core/services/patient.service';
import { TriageService } from '../../core/services/triage.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-triage-list',
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterLink, EmptyStateComponent, StatusBadgeComponent],
  template: `
    <section class="page">
      <div class="page-title">
        <div>
          <h1>Triaje</h1>
          <p>Citas con check-in listas para registrar signos vitales.</p>
        </div>
      </div>

      @if (vm$ | async; as vm) {
        @if (vm.length) {
          <div class="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Paciente</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                @for (item of vm; track item.appointment.id) {
                  <tr>
                    <td>{{ item.appointment.scheduledAt | date: 'short' }}</td>
                    <td>{{ item.patient }}</td>
                    <td><app-status-badge [value]="item.appointment.status" /></td>
                    <td><a [routerLink]="['/app/triage', item.appointment.id]">Registrar</a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-empty-state title="Sin triajes pendientes" message="No hay citas en CHECKED_IN." />
        }
      }
    </section>
  `
})
export class TriageListComponent {
  private readonly triage = inject(TriageService);
  private readonly patients = inject(PatientService);
  readonly vm$ = this.triage.pendingAppointments().pipe(
    switchMap((appointments) =>
      forkJoin({ appointments: [appointments], patients: this.patients.list() })
    ),
    map(({ appointments, patients }) =>
      appointments.map((appointment) => ({
        appointment,
        patient:
          patients.find((patient) => patient.id === appointment.patientId)?.fullName ??
          'Paciente no encontrado'
      }))
    )
  );
}
