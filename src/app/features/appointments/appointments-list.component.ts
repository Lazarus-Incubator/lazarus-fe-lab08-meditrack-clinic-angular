import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, debounceTime, forkJoin, map, mergeMap, startWith } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { DoctorService } from '../../core/services/doctor.service';
import { PatientService } from '../../core/services/patient.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule, RouterLink, StatusBadgeComponent],
  template: `
    <section class="page">
      <div class="page-title">
        <div>
          <h1>Citas</h1>
          <p>Filtros principales conservados en query params.</p>
        </div>
        @if (session()?.user?.role === 'ADMIN' || session()?.user?.role === 'RECEPCION') {
          <a class="button" routerLink="/app/appointments/new">Nueva cita</a>
        }
      </div>

      <form class="toolbar" [formGroup]="filters">
        <input type="date" formControlName="date" />
        <select formControlName="status">
          <option value="">Todos los estados</option>
          @for (status of statuses; track status) {
            <option [value]="status.value">{{ status.label }}</option>
          }
        </select>
        <select formControlName="doctorId">
          <option value="">Todos los medicos</option>
          @for (doctor of doctors$ | async; track doctor.id) {
            <option [value]="doctor.id">{{ doctor.fullName }}</option>
          }
        </select>
        <button type="button" class="secondary" (click)="clearFilters()">Limpiar filtros</button>
      </form>

      @if (vm$ | async; as vm) {
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Fecha</th><th>Paciente</th><th>Medico</th><th>Estado</th><th>Motivo</th><th></th></tr>
            </thead>
            <tbody>
              @for (item of vm; track item.appointment.id) {
                <tr>
                  <td>{{ item.appointment.scheduledAt | date: 'short' }}</td>
                  <td>{{ item.patient }}</td>
                  <td>{{ item.doctor }}</td>
                  <td><app-status-badge [value]="item.appointment.status" /></td>
                  <td>{{ item.appointment.reason }}</td>
                  <td>
                    @if (session()?.user?.role === 'MEDICO' && item.appointment.status === 'CHECKED_IN') {
                      <a [routerLink]="['/app/consultations', item.appointment.id]">Atender</a>
                    } @else {
                      <a [routerLink]="['/app/appointments', item.appointment.id]">Ver</a>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="loading">Cargando citas...</div>
      }
    </section>
  `
})
export class AppointmentsListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly appointments = inject(AppointmentService);
  private readonly doctors = inject(DoctorService);
  private readonly patients = inject(PatientService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  readonly session = this.auth.session;
  readonly statuses = [
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'Checked in', label: 'Checked in' },
    { value: 'TRIAGE_DONE', label: 'Triage done' },
    { value: 'IN_CONSULTATION', label: 'In consultation' },
    { value: 'PENDING_PAYMENT', label: 'Pending payment' },
    { value: 'PAID', label: 'Paid' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'NO_SHOW', label: 'No show' }
  ];
  readonly doctors$ = this.doctors.doctors();
  readonly filters = this.fb.nonNullable.group({
    // Keep the most common filters in the route.
    date: [''],
    status: [this.route.snapshot.queryParamMap.get('status') ?? ''],
    doctorId: ['']
  });
  readonly vm$ = combineLatest([
    this.filters.valueChanges.pipe(startWith(this.filters.getRawValue()), debounceTime(150))
  ]).pipe(
    map(([filters]) => filters),
    // Allow all filter requests to complete naturally.
    mergeMap((filters) => {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: filters,
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
      return forkJoin({
        appointments: this.appointments.list(filters),
        patients: this.patients.list(),
        doctors: this.doctors.doctors()
      });
    }),
    map(({ appointments, patients, doctors }) =>
      appointments
        .filter((appointment) => {
          const currentUser = this.auth.currentUser();
          const currentDoctor = doctors.find((doctor) => doctor.userId === currentUser?.id);
          // Apply schedule filters after loading the daily appointments.
          return currentUser?.role === 'MEDICO' && !this.filters.controls.date.value && !this.filters.controls.status.value
            ? appointment.doctorId === currentDoctor?.id
            : true;
        })
        .map((appointment) => ({
          appointment,
          patient:
            patients.find((patient) => patient.id === appointment.patientId)?.fullName ??
            'Paciente no encontrado',
          doctor: doctors.find((doctor) => doctor.id === appointment.doctorId)?.fullName ?? '-'
        }))
    )
  );

  constructor() {
    // Initialize the screen with the default operational view.
    setTimeout(() => this.filters.patchValue({ status: 'SCHEDULED' }), 0);
  }

  clearFilters(): void {
    // Reset the visible form state first.
    this.filters.reset({ date: '', status: '', doctorId: '' }, { emitEvent: false });
  }
}
