import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, forkJoin, switchMap } from 'rxjs';
import { Appointment, AppointmentAction } from '../../core/models/domain.models';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { AppointmentWorkflowService } from '../../core/services/appointment-workflow.service';
import { DoctorService } from '../../core/services/doctor.service';
import { PatientService } from '../../core/services/patient.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterLink, StatusBadgeComponent],
  template: `
    <section class="page">
      @if (vm$ | async; as vm) {
        <div class="page-title">
          <div>
            <h1>Cita {{ vm.appointment.id }}</h1>
            <p>{{ vm.appointment.scheduledAt | date: 'short' }}</p>
          </div>
          <a class="secondary" routerLink="/app/appointments">Volver</a>
        </div>
        @if (error()) { <div class="alert">{{ error() }}</div> }

        <article class="card detail-grid">
          <div><span>Paciente</span><strong>{{ vm.patient.fullName }}</strong></div>
          <div><span>Medico</span><strong>{{ vm.doctor.fullName }}</strong></div>
          <div><span>Especialidad</span><strong>{{ vm.specialty.name }}</strong></div>
          <div><span>Estado</span><app-status-badge [value]="vm.appointment.status" /></div>
          <div class="full"><span>Motivo</span><strong>{{ vm.appointment.reason }}</strong></div>
          @if (vm.appointment.checkedInAt) {
            <div><span>Check-in</span><strong>{{ vm.appointment.checkedInAt | date: 'short' }}</strong></div>
          }
        </article>

        <div class="actions">
          @for (action of actions(vm.appointment); track action.key) {
            @if (action.route) {
              <a class="button" [routerLink]="action.route">{{ action.label }}</a>
            } @else {
              <button type="button" (click)="runAction(action, vm.appointment)" [disabled]="saving()">
                {{ action.label }}
              </button>
            }
          }
        </div>
        @if (vm.appointment.status === 'CLOSED') {
          <div class="card">
            <div class="section-heading">
              <h2>Registros relacionados</h2>
            </div>
            <!-- Related records remain accessible after closure. -->
            <div class="actions">
              <a class="secondary" [routerLink]="['/app/billing', vm.appointment.id]">Ver cobro</a>
              <a class="secondary" routerLink="/app/lab/orders">Ver laboratorio</a>
              <a class="secondary" routerLink="/app/pharmacy/prescriptions">Ver farmacia</a>
            </div>
          </div>
        }
      } @else {
        <div class="loading">Cargando cita...</div>
      }
    </section>
  `
})
export class AppointmentDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly appointments = inject(AppointmentService);
  private readonly workflow = inject(AppointmentWorkflowService);
  private readonly patients = inject(PatientService);
  private readonly doctors = inject(DoctorService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new BehaviorSubject<void>(undefined);

  readonly saving = signal(false);
  readonly error = signal('');
  readonly vm$ = this.reload.pipe(
    switchMap(() =>
      this.route.paramMap.pipe(
        switchMap((params) => {
          const id = params.get('id') ?? '';
          return this.appointments.get(id);
        }),
        switchMap((appointment) =>
          forkJoin({
            appointment: [appointment],
            patient: this.patients.get(appointment.patientId),
            doctors: this.doctors.doctors(),
            specialties: this.doctors.specialties()
          })
        )
      )
    ),
    switchMap(({ appointment, patient, doctors, specialties }) => {
      // Visible actions are resolved at component level.
      if (
        this.route.snapshot.queryParamMap.get('action') === 'cancel' &&
        appointment.status === 'SCHEDULED'
      ) {
        const user = this.auth.currentUser();
        if (user) {
          this.appointments
            .transition(appointment, 'CANCELLED', user, 'Cita cancelada')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }
      }
      const doctor = doctors.find((item) => item.id === appointment.doctorId);
      const specialty = specialties.find((item) => item.id === appointment.specialtyId);
      return [
        {
          appointment,
          patient,
          doctor: doctor ?? { id: '-', fullName: 'No encontrado', specialtyId: '-', active: false },
          specialty: specialty ?? { id: '-', name: 'No encontrada', active: false }
        }
      ];
    })
  );

  actions(appointment: Appointment): AppointmentAction[] {
    return this.workflow.getAvailableAppointmentActions(appointment, this.auth.currentUser());
  }

  runAction(action: AppointmentAction, appointment: Appointment): void {
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }
    this.saving.set(true);
    const transition =
      action.key === 'CHECK_IN'
        ? this.appointments.transition(appointment, 'CHECKED_IN', user, 'Check-in realizado')
        : action.key === 'CANCEL'
          ? this.appointments.transition(appointment, 'CANCELLED', user, 'Cita cancelada')
          : action.key === 'CLOSE'
            ? this.appointments.transition(appointment, 'CLOSED', user, 'Atencion cerrada')
            : undefined;

    if (!transition) {
      return;
    }
    transition.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.reload.next();
        if (action.key === 'CLOSE') {
          void this.router.navigate(['/app/appointments', appointment.id]);
        }
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.saving.set(false);
      }
    });
  }
}
