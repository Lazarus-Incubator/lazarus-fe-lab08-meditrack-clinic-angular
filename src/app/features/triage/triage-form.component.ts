import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { PatientService } from '../../core/services/patient.service';
import { TriageService } from '../../core/services/triage.service';
import { rangeValidator } from '../../shared/validators/vital-signs.validators';

@Component({
  selector: 'app-triage-form',
  standalone: true,
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page narrow">
      @if (vm$ | async; as vm) {
        <div class="page-title">
          <div>
            <h1>Registrar triaje</h1>
            <p>{{ vm.patient.fullName }} · {{ vm.appointment.scheduledAt | date: 'short' }}</p>
          </div>
          <a class="secondary" [routerLink]="['/app/appointments', vm.appointment.id]">Volver</a>
        </div>
        @if (vm.appointment.status !== 'CHECKED_IN') {
          <div class="alert">Solo se puede registrar triaje para citas en CHECKED_IN.</div>
        }
        @if (error()) { <div class="alert">{{ error() }}</div> }

        <form class="card form-grid" [formGroup]="form" (ngSubmit)="save(vm.appointment)">
          @for (field of fields; track field.name) {
            <label>
              {{ field.label }}
              <input type="number" [formControlName]="field.name" />
              @if (form.controls[field.name].touched && form.controls[field.name].invalid) {
                <small>{{ field.message }}</small>
              }
            </label>
          }
          <label class="full">
            Notas
            <textarea rows="4" formControlName="notes"></textarea>
          </label>
          <div class="actions full">
            <button type="submit" [disabled]="form.invalid || saving() || vm.appointment.status === 'CLOSED'">
              {{ saving() ? 'Guardando...' : 'Guardar triaje' }}
            </button>
          </div>
        </form>
      }
    </section>
  `
})
export class TriageFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appointments = inject(AppointmentService);
  private readonly patients = inject(PatientService);
  private readonly triage = inject(TriageService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly error = signal('');
  readonly fields = [
    { name: 'temperature' as const, label: 'Temperatura', message: 'Debe estar entre 30 y 45.' },
    { name: 'bloodPressureSystolic' as const, label: 'Presion sistolica', message: 'Debe estar entre 60 y 250.' },
    { name: 'bloodPressureDiastolic' as const, label: 'Presion diastolica', message: 'Debe estar entre 40 y 180.' },
    { name: 'heartRate' as const, label: 'Frecuencia cardiaca', message: 'Debe estar entre 30 y 220.' },
    { name: 'respiratoryRate' as const, label: 'Frecuencia respiratoria', message: 'Debe estar entre 5 y 60.' },
    { name: 'oxygenSaturation' as const, label: 'Saturacion O2', message: 'Debe estar entre 50 y 100.' },
    { name: 'weight' as const, label: 'Peso', message: 'Debe ser mayor a 0.' },
    { name: 'height' as const, label: 'Talla', message: 'Debe ser mayor a 0.' }
  ];
  readonly form = this.fb.nonNullable.group({
    temperature: [36.5, [Validators.required, rangeValidator(30, 45, 'Temperatura')]],
    bloodPressureSystolic: [120, [Validators.required, rangeValidator(60, 250, 'Sistolica')]],
    bloodPressureDiastolic: [80, [Validators.required, rangeValidator(40, 180, 'Diastolica')]],
    heartRate: [72, [Validators.required, rangeValidator(30, 220, 'Frecuencia cardiaca')]],
    respiratoryRate: [18, [Validators.required, rangeValidator(5, 60, 'Frecuencia respiratoria')]],
    oxygenSaturation: [98, [rangeValidator(50, 100, 'Saturacion')]],
    weight: [70, [Validators.required, rangeValidator(0.1, 400, 'Peso')]],
    height: [1.7, [Validators.required, rangeValidator(0.1, 2.5, 'Talla')]],
    notes: ['']
  });
  readonly vm$ = this.route.paramMap.pipe(
    switchMap((params) => this.appointments.get(params.get('appointmentId') ?? '')),
    switchMap((appointment) =>
      forkJoin({ appointment: [appointment], patient: this.patients.get(appointment.patientId) })
    )
  );

  save(appointment: Parameters<TriageService['create']>[0]): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();
    // Convert numeric fields before sending them.
    const payload = {
      ...raw,
      oxygenSaturation: Number(raw.oxygenSaturation)
    };
    this.triage
      .create(appointment, payload, user)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate(['/app/appointments', appointment.id]),
        error: (error: Error) => {
          this.error.set(error.message);
          this.saving.set(false);
        }
      });
  }
}
