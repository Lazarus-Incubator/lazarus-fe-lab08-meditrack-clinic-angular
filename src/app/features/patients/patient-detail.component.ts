import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { PatientService } from '../../core/services/patient.service';
import { AgePipe } from '../../shared/pipes/age.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterLink, AgePipe, StatusBadgeComponent],
  template: `
    <section class="page">
      @if (vm$ | async; as vm) {
        <div class="page-title">
          <div>
            <h1>{{ vm.patient.fullName }}</h1>
            <p>Documento {{ vm.patient.documentNumber }} · {{ vm.patient.birthDate | age }} anos</p>
          </div>
          <a class="secondary" routerLink="/app/patients">Volver</a>
        </div>

        <article class="card detail-grid">
          <div><span>Genero</span><strong>{{ vm.patient.gender }}</strong></div>
          <div><span>Telefono</span><strong>{{ vm.patient.phone || '-' }}</strong></div>
          @if (session()?.user?.role !== 'AUDITOR') {
            <div><span>Email</span><strong>{{ vm.patient.email || '-' }}</strong></div>
            <div><span>Direccion</span><strong>{{ vm.patient.address || '-' }}</strong></div>
          }
          <div><span>Estado</span><strong>{{ vm.patient.active ? 'Activo' : 'Inactivo' }}</strong></div>
        </article>

        <h2>Citas asociadas</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Estado</th><th>Motivo</th><th></th></tr></thead>
            <tbody>
              @for (appointment of vm.appointments; track appointment.id) {
                <tr>
                  <td>{{ appointment.scheduledAt | date: 'short' }}</td>
                  <td><app-status-badge [value]="appointment.status" /></td>
                  <td>{{ appointment.reason }}</td>
                  <td><a [routerLink]="['/app/appointments', appointment.id]">Ver</a></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="loading">Cargando paciente...</div>
      }
    </section>
  `
})
export class PatientDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly patients = inject(PatientService);
  private readonly appointments = inject(AppointmentService);
  private readonly auth = inject(AuthService);
  readonly session = this.auth.session;
  readonly vm$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const id = params.get('id') ?? '';
      return forkJoin({
        patient: this.patients.get(id),
        appointments: this.appointments.byPatient(id)
      });
    })
  );
}
