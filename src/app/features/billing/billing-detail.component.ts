import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, forkJoin, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { BillingService } from '../../core/services/billing.service';
import { PatientService } from '../../core/services/patient.service';
import { calculateBillingBalance } from '../../core/utils/billing.utils';
import { positivePaymentValidator } from '../../shared/validators/billing.validators';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-billing-detail',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, RouterLink, StatusBadgeComponent],
  template: `
    <section class="page narrow">
      @if (vm$ | async; as vm) {
        <div class="page-title">
          <div><h1>Cobro</h1><p>{{ vm.patient.fullName }}</p></div>
          <a class="secondary" routerLink="/app/billing">Volver</a>
        </div>
        @if (error()) { <div class="alert">{{ error() }}</div> }
        <article class="card detail-grid">
          <div><span>Consulta</span><strong>S/ {{ vm.record.consultationAmount.toFixed(2) }}</strong></div>
          <div><span>Laboratorio</span><strong>S/ {{ vm.record.labAmount.toFixed(2) }}</strong></div>
          <div><span>Medicamentos</span><strong>S/ {{ vm.record.medicationAmount.toFixed(2) }}</strong></div>
          <div><span>Descuento</span><strong>S/ {{ vm.record.discount.toFixed(2) }}</strong></div>
          <div><span>Total</span><strong>S/ {{ vm.record.total.toFixed(2) }}</strong></div>
          <div><span>Pagado</span><strong>S/ {{ vm.record.paidAmount.toFixed(2) }}</strong></div>
          <div><span>Saldo</span><strong>S/ {{ balance(vm.record).toFixed(2) }}</strong></div>
          <div><span>Estado</span><app-status-badge [value]="vm.record.status" /></div>
        </article>

        @if (vm.record.status !== 'PAID') {
          <form class="card form-grid" [formGroup]="form" (ngSubmit)="pay(vm.record)">
            <label>
              Monto
              <input type="number" min="0.01" step="0.01" formControlName="amount" />
              @if (form.controls.amount.touched && form.controls.amount.invalid) {
                <small>El pago debe ser positivo.</small>
              }
            </label>
            <label>
              Metodo
              <select formControlName="method">
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </label>
            <label>
              Descuento
              <input type="number" min="0" step="0.01" formControlName="discount" />
            </label>
            <div class="actions full">
              <button type="button" class="secondary" (click)="applyDiscount(vm.record)" [disabled]="saving()">
                Aplicar descuento
              </button>
              <button type="submit" [disabled]="form.invalid">Registrar pago</button>
            </div>
          </form>
        } @else {
          <div class="actions">
            <button type="button" (click)="close(vm.record)" [disabled]="saving() || vm.appointment.status === 'CLOSED'">
              {{ vm.appointment.status === 'CLOSED' ? 'Atencion cerrada' : 'Cerrar atencion' }}
            </button>
          </div>
        }
      }
    </section>
  `
})
export class BillingDetailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly billing = inject(BillingService);
  private readonly appointments = inject(AppointmentService);
  private readonly patients = inject(PatientService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new BehaviorSubject<void>(undefined);

  readonly saving = signal(false);
  readonly error = signal('');
  readonly balance = calculateBillingBalance;
  readonly form = this.fb.nonNullable.group({
    amount: [0, [Validators.required, positivePaymentValidator()]],
    method: ['EFECTIVO' as const, Validators.required],
    discount: [0]
  });
  readonly vm$ = this.reload.pipe(
    switchMap(() => this.route.paramMap),
    switchMap((params) => this.billing.byAppointment(params.get('appointmentId') ?? '')),
    switchMap((records) => {
      const record = records[0];
      return forkJoin({
        record: [record],
        appointment: this.appointments.get(record.appointmentId),
        patient: this.patients.get(record.patientId)
      });
    })
  );

  pay(record: Parameters<BillingService['registerPayment']>[0]): void {
    const user = this.auth.currentUser();
    if (!user || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    // Keep the payment button responsive for cash desk speed.
    this.billing
      .registerPayment(record, this.form.controls.amount.value, this.form.controls.method.value, user)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.form.reset({ amount: 0, method: 'EFECTIVO', discount: 0 });
          this.saving.set(false);
          this.reload.next();
        },
        error: (error: Error) => {
          this.error.set(error.message);
          this.saving.set(false);
        }
      });
  }

  applyDiscount(record: Parameters<BillingService['updateDiscount']>[0]): void {
    this.saving.set(true);
    this.billing
      .updateDiscount(record, this.form.controls.discount.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.reload.next();
        },
        error: (error: Error) => {
          this.error.set(error.message);
          this.saving.set(false);
        }
      });
  }

  close(record: Parameters<BillingService['closeAppointment']>[0]): void {
    const user = this.auth.currentUser();
    if (!user || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.billing
      .closeAppointment(record, user)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.reload.next();
        },
        error: (error: Error) => {
          this.error.set(error.message);
          this.saving.set(false);
        }
      });
  }
}
