import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { ConsultationService } from '../../core/services/consultation.service';
import { PatientService } from '../../core/services/patient.service';
import { PharmacyService } from '../../core/services/pharmacy.service';

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      @if (vm$ | async; as vm) {
        <div class="page-title">
          <div>
            <h1>Atencion medica</h1>
            <p>{{ vm.patient.fullName }} · {{ vm.appointment.scheduledAt | date: 'short' }}</p>
          </div>
          <a class="secondary" [routerLink]="['/app/appointments', vm.appointment.id]">Volver</a>
        </div>
        @if (!['TRIAGE_DONE', 'CHECKED_IN'].includes(vm.appointment.status)) {
          <div class="alert">La consulta requiere triaje completado.</div>
        }
        @if (error()) { <div class="alert">{{ error() }}</div> }

        <form class="card stacked-form" [formGroup]="form" (ngSubmit)="finish(vm.appointment)">
          <div class="form-grid">
            <label>
              Motivo de atencion
              <input formControlName="reason" />
            </label>
            <label>
              Diagnostico preliminar
              <input formControlName="preliminaryDiagnosis" />
            </label>
            <label class="full">
              Notas clinicas
              <textarea rows="4" formControlName="clinicalNotes"></textarea>
            </label>
            <label class="full">
              Plan de tratamiento
              <textarea rows="4" formControlName="treatmentPlan"></textarea>
            </label>
          </div>

          <div class="subsection">
            <div class="section-heading">
              <h2>Ordenes de laboratorio</h2>
              <button type="button" class="secondary" (click)="addLabOrder()">Agregar orden</button>
            </div>
            <div formArrayName="labOrders" class="rows">
              @for (group of labOrders.controls; track $index; let i = $index) {
                <div class="inline-row" [formGroupName]="i">
                  <input placeholder="Prueba" formControlName="testName" />
                  <select formControlName="priority">
                    <option value="ROUTINE">Routine</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                  <button type="button" class="danger" (click)="removeLabOrder(i)">Quitar</button>
                </div>
              }
            </div>
          </div>

          <div class="subsection">
            <div class="section-heading">
              <h2>Receta</h2>
              <button type="button" class="secondary" (click)="addPrescriptionItem()">Agregar medicamento</button>
            </div>
            <div formArrayName="prescriptionItems" class="rows">
              @for (group of prescriptionItems.controls; track $index; let i = $index) {
                <!-- Each row represents the medication instruction entered by the doctor. -->
                <div class="inline-row" [formGroupName]="i">
                  <select formControlName="medicationId">
                    <option value="">Medicamento</option>
                    @for (medication of vm.medications; track medication.id) {
                      <option [value]="medication.id">{{ medication.name }} (stock {{ medication.stock }})</option>
                    }
                  </select>
                  <input type="number" min="1" formControlName="quantity" />
                  <input placeholder="Indicaciones" formControlName="instructions" />
                  <button type="button" class="danger" (click)="removePrescriptionItem(i)">Quitar</button>
                </div>
              }
            </div>
          </div>

          <div class="actions">
            <button type="submit" [disabled]="form.invalid || saving() || !['TRIAGE_DONE', 'CHECKED_IN'].includes(vm.appointment.status)">
              {{ saving() ? 'Finalizando...' : 'Finalizar consulta' }}
            </button>
          </div>
        </form>
      }
    </section>
  `
})
export class ConsultationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appointments = inject(AppointmentService);
  private readonly patients = inject(PatientService);
  private readonly pharmacy = inject(PharmacyService);
  private readonly consultations = inject(ConsultationService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    reason: ['', Validators.required],
    clinicalNotes: ['', Validators.required],
    preliminaryDiagnosis: ['', Validators.required],
    treatmentPlan: ['', Validators.required],
    labOrders: this.fb.array([
      this.fb.nonNullable.group({
        testName: ['', Validators.required],
        priority: ['ROUTINE' as const, Validators.required]
      })
    ]),
    prescriptionItems: this.fb.array([
      this.fb.nonNullable.group({
        medicationId: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        instructions: ['', Validators.required]
      })
    ])
  });
  readonly vm$ = this.route.paramMap.pipe(
    switchMap((params) => this.appointments.get(params.get('appointmentId') ?? '')),
    switchMap((appointment) =>
      forkJoin({
        appointment: [appointment],
        patient: this.patients.get(appointment.patientId),
        medications: this.pharmacy.medications()
      })
    )
  );

  get labOrders(): FormArray {
    return this.form.controls.labOrders;
  }

  get prescriptionItems(): FormArray {
    return this.form.controls.prescriptionItems;
  }

  addLabOrder(): void {
    this.labOrders.push(
      this.fb.nonNullable.group({
        testName: ['', Validators.required],
        priority: ['ROUTINE' as const, Validators.required]
      })
    );
  }

  removeLabOrder(index: number): void {
    this.labOrders.removeAt(index);
  }

  addPrescriptionItem(): void {
    this.prescriptionItems.push(
      this.fb.nonNullable.group({
        medicationId: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        instructions: ['', Validators.required]
      })
    );
  }

  removePrescriptionItem(index: number): void {
    this.prescriptionItems.removeAt(index);
  }

  finish(appointment: Parameters<ConsultationService['finish']>[0]): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }
    this.saving.set(true);
    this.consultations
      .finish(appointment, this.form.getRawValue(), user)
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
