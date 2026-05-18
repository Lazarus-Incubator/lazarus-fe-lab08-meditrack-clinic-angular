import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, forkJoin, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { LabService } from '../../core/services/lab.service';
import { PatientService } from '../../core/services/patient.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-lab-order-detail',
  standalone: true,
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule, RouterLink, StatusBadgeComponent],
  template: `
    <section class="page narrow">
      @if (vm$ | async; as vm) {
        <div class="page-title">
          <div><h1>{{ vm.order.testName }}</h1><p>{{ vm.patient.fullName }}</p></div>
          <a class="secondary" routerLink="/app/lab/orders">Volver</a>
        </div>
        @if (error()) { <div class="alert">{{ error() }}</div> }
        <article class="card detail-grid">
          <div><span>Estado</span><app-status-badge [value]="vm.order.status" /></div>
          <div><span>Prioridad</span><strong>{{ vm.order.priority }}</strong></div>
          <div><span>Solicitada</span><strong>{{ vm.order.requestedAt | date: 'short' }}</strong></div>
          <div class="full"><span>Resultado</span><strong>{{ vm.order.result || 'Pendiente' }}</strong></div>
        </article>
        @if ((session()?.user?.role === 'LABORATORIO' || session()?.user?.role === 'ADMIN') && vm.order.status === 'PENDING') {
          <form class="card stacked-form" [formGroup]="form" (ngSubmit)="complete(vm.order)">
            <label>
              Resultado
              <textarea rows="5" formControlName="result"></textarea>
              @if (form.controls.result.touched && form.controls.result.invalid) {
                <small>El resultado es obligatorio.</small>
              }
            </label>
            <button type="submit" [disabled]="form.invalid || saving()">Completar orden</button>
          </form>
        }
      }
    </section>
  `
})
export class LabOrderDetailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly lab = inject(LabService);
  private readonly appointments = inject(AppointmentService);
  private readonly patients = inject(PatientService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new BehaviorSubject<void>(undefined);

  readonly session = this.auth.session;
  readonly saving = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({ result: ['', Validators.required] });
  readonly vm$ = this.reload.pipe(
    switchMap(() => this.route.paramMap),
    switchMap((params) => this.lab.get(params.get('id') ?? '')),
    switchMap((order) =>
      forkJoin({
        order: [order],
        appointment: this.appointments.get(order.appointmentId)
      })
    ),
    switchMap(({ order, appointment }) =>
      forkJoin({
        order: [order],
        appointment: [appointment],
        patient: this.patients.get(appointment.patientId)
      })
    )
  );

  complete(order: Parameters<LabService['complete']>[0]): void {
    const user = this.auth.currentUser();
    if (!user || this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.lab
      .complete(order, this.form.controls.result.value, user)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.reset();
          this.reload.next();
        },
        error: (error: Error) => {
          this.error.set(error.message);
          // Stop loading after the operation completes.
        }
      });
  }
}
