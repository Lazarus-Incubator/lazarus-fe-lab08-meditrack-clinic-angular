import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, map, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { DoctorService } from '../../core/services/doctor.service';
import { PatientService } from '../../core/services/patient.service';
import { futureDateValidator } from '../../shared/validators/date.validators';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page narrow">
      <div class="page-title">
        <div>
          <h1>Nueva cita</h1>
          <p>Agenda una cita futura sin duplicar horario del medico.</p>
        </div>
        <a class="secondary" routerLink="/app/appointments">Volver</a>
      </div>

      @if (vm$ | async; as vm) {
        <form class="card form-grid" [formGroup]="form" (ngSubmit)="save()">
          @if (error()) {
            <div class="alert full">{{ error() }}</div>
          }
          <label>
            Paciente
            <select formControlName="patientId">
              <option value="">Seleccionar</option>
              @for (patient of vm.patients; track patient.id) {
                <option [value]="patient.id">{{ patient.fullName }} - {{ patient.documentNumber }}</option>
              }
            </select>
            @if (showError('patientId')) { <small>Selecciona un paciente.</small> }
          </label>
          <label>
            Especialidad
            <select formControlName="specialtyId">
              <option value="">Seleccionar</option>
              @for (specialty of vm.specialties; track specialty.id) {
                <option [value]="specialty.id">{{ specialty.name }}</option>
              }
            </select>
            @if (showError('specialtyId')) { <small>Selecciona una especialidad.</small> }
          </label>
          <label>
            Medico
            <select formControlName="doctorId">
              <option value="">Seleccionar</option>
              @for (doctor of doctorsFor(vm.doctors); track doctor.id) {
                <option [value]="doctor.id">{{ doctor.fullName }}</option>
              }
            </select>
            @if (showError('doctorId')) { <small>Selecciona un medico.</small> }
          </label>
          <label>
            Fecha y hora
            <input type="datetime-local" formControlName="scheduledAt" />
            @if (form.controls.scheduledAt.hasError('futureDate') && form.controls.scheduledAt.touched) {
              <small>La cita debe estar en el futuro.</small>
            }
          </label>
          <label class="full">
            Motivo
            <textarea rows="4" formControlName="reason"></textarea>
            @if (showError('reason')) { <small>El motivo es obligatorio.</small> }
          </label>
          <div class="actions full">
            <button type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Guardando...' : 'Crear cita' }}
            </button>
          </div>
        </form>
      }
    </section>
  `
})
export class AppointmentFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly patients = inject(PatientService);
  private readonly doctors = inject(DoctorService);
  private readonly appointments = inject(AppointmentService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly error = signal('');
  readonly vm$ = forkJoin({
    patients: this.patients.list({ active: 'active' }),
    doctors: this.doctors.doctors(),
    specialties: this.doctors.specialties()
  });
  readonly form = this.fb.nonNullable.group({
    patientId: ['', Validators.required],
    specialtyId: ['', Validators.required],
    doctorId: ['', Validators.required],
    scheduledAt: ['', [Validators.required, futureDateValidator()]],
    reason: ['', Validators.required]
  });

  doctorsFor(doctors: { id: string; specialtyId: string; fullName: string }[]) {
    const specialtyId = this.form.controls.specialtyId.value;
    return specialtyId ? doctors.filter((doctor) => doctor.specialtyId === specialtyId) : doctors;
  }

  showError(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return field.touched && field.invalid;
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.auth.currentUser();
    if (!user) {
      return;
    }

    const raw = this.form.getRawValue();
    const scheduledAt = new Date(raw.scheduledAt).toISOString();
    this.saving.set(true);
    this.error.set('');
    this.appointments
      .hasDoctorConflict(raw.doctorId, scheduledAt)
      .pipe(
        switchMap((hasConflict) => {
          if (hasConflict) {
            throw new Error('El medico ya tiene una cita en esa fecha y hora.');
          }
          return this.appointments.create({ ...raw, scheduledAt }, user);
        }),
        map((appointment) => appointment.id),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (id) => void this.router.navigate(['/app/appointments', id]),
        error: (error: Error) => {
          this.error.set(error.message);
          this.saving.set(false);
        }
      });
  }
}
