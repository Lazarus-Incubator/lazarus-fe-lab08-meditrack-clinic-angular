import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { combineLatest, debounceTime, forkJoin, map, startWith, switchMap } from 'rxjs';
import { AppointmentService } from '../../core/services/appointment.service';
import { BillingService } from '../../core/services/billing.service';
import { PatientService } from '../../core/services/patient.service';
import { calculateBillingBalance } from '../../core/utils/billing.utils';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, RouterLink, StatusBadgeComponent],
  template: `
    <section class="page">
      <div class="page-title"><div><h1>Caja</h1><p>Cobros pendientes, parciales y pagados.</p></div></div>
      <form class="toolbar" [formGroup]="filters">
        <select formControlName="status">
          <option value="">Todos</option>
          <option value="PENDING">Pendiente</option>
          <option value="PARTIAL">Parcial</option>
          <option value="PAID">Pagado</option>
        </select>
      </form>
      @if (vm$ | async; as vm) {
        <div class="summary-strip">Total pendiente: <strong>S/ {{ totalPending(vm).toFixed(2) }}</strong></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Paciente</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              @for (item of vm; track item.record.id) {
                <tr>
                  <td>{{ item.patient }}</td>
                  <td>S/ {{ item.record.total.toFixed(2) }}</td>
                  <td>S/ {{ item.record.paidAmount.toFixed(2) }}</td>
                  <td>S/ {{ balance(item.record).toFixed(2) }}</td>
                  <td><app-status-badge [value]="item.record.status" /></td>
                  <td><a [routerLink]="['/app/billing', item.record.appointmentId]">Cobrar</a></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `
})
export class BillingListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly billing = inject(BillingService);
  private readonly appointments = inject(AppointmentService);
  private readonly patients = inject(PatientService);
  readonly filters = this.fb.nonNullable.group({ status: [''] });
  readonly vm$ = combineLatest([
    this.filters.valueChanges.pipe(startWith(this.filters.getRawValue()), debounceTime(150))
  ]).pipe(
    map(([filters]) => filters),
    switchMap((filters) =>
      forkJoin({
        records: this.billing.list(filters),
        appointments: this.appointments.list(),
        patients: this.patients.list()
      })
    ),
    map(({ records, appointments, patients }) =>
      records.map((record) => {
        const appointment = appointments.find((item) => item.id === record.appointmentId);
        return {
          record,
          patient:
            patients.find((patient) => patient.id === appointment?.patientId)?.fullName ??
            'Paciente no encontrado'
        };
      })
    )
  );

  balance = calculateBillingBalance;

  totalPending(items: { record: Parameters<typeof calculateBillingBalance>[0] }[]): number {
    return items.reduce((total, item) => total + calculateBillingBalance(item.record), 0);
  }
}
