import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuditLogService } from '../../core/services/audit-log.service';
import { PatientService } from '../../core/services/patient.service';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page narrow">
      <div class="page-title">
        <div>
          <h1>Nuevo paciente</h1>
          <p>Datos ficticios para el laboratorio academico.</p>
        </div>
        <a class="secondary" routerLink="/app/patients">Volver</a>
      </div>

      <form class="card form-grid" [formGroup]="form" (ngSubmit)="save()">
        @if (error()) {
          <div class="alert full">{{ error() }}</div>
        }
        <label>
          Documento
          <input formControlName="documentNumber" />
          @if (showError('documentNumber')) { <small>Documento obligatorio.</small> }
        </label>
        <label>
          Nombre completo
          <input formControlName="fullName" />
          @if (showError('fullName')) { <small>Nombre obligatorio.</small> }
        </label>
        <label>
          Fecha de nacimiento
          <input type="date" formControlName="birthDate" />
          @if (showError('birthDate')) { <small>Fecha obligatoria.</small> }
        </label>
        <label>
          Genero
          <select formControlName="gender">
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="X">No especificado</option>
          </select>
        </label>
        <label>
          Telefono
          <input formControlName="phone" />
        </label>
        <label>
          Email
          <input type="email" formControlName="email" />
          @if (showError('email')) { <small>Email invalido.</small> }
        </label>
        <label class="full">
          Direccion
          <input formControlName="address" />
        </label>
        <div class="actions full">
          <button type="submit" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Guardando...' : 'Guardar paciente' }}
          </button>
        </div>
      </form>
    </section>
  `
})
export class PatientFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly patients = inject(PatientService);
  private readonly audit = inject(AuditLogService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    documentNumber: ['', Validators.required],
    fullName: ['', Validators.required],
    birthDate: ['', Validators.required],
    gender: ['F' as const],
    phone: [''],
    email: ['', Validators.email],
    address: ['']
  });

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
    this.saving.set(true);
    this.patients
      .create(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (patient) => {
          this.audit.create('Patient', patient.id, 'CREATE', 'Paciente creado', user).subscribe();
          void this.router.navigate(['/app/patients', patient.id]);
        },
        error: (error: Error) => {
          this.error.set(error.message);
          this.saving.set(false);
        }
      });
  }
}
