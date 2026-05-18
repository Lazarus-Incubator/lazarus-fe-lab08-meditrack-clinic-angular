import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { combineLatest, debounceTime, forkJoin, map, startWith, switchMap } from 'rxjs';
import { AppointmentService } from '../../core/services/appointment.service';
import { PatientService } from '../../core/services/patient.service';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-prescriptions-list',
  standalone: true,
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule, RouterLink, StatusBadgeComponent],
  template: `
    <section class="page">
      <div class="page-title"><div><h1>Farmacia</h1><p>Recetas pendientes y despachadas.</p></div></div>
      <form class="toolbar" [formGroup]="filters">
        <select formControlName="status">
          <option value="">Todas</option>
          <option value="PENDING">Pendiente</option>
          <option value="DISPENSED">Despachada</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
      </form>
      @if (vm$ | async; as vm) {
        <div class="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Paciente</th><th>Items</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              @for (item of vm; track item.prescription.id) {
                <tr>
                  <td>{{ item.prescription.createdAt | date: 'short' }}</td>
                  <td>{{ item.patient }}</td>
                  <td>{{ item.prescription.items.length }}</td>
                  <td><app-status-badge [value]="item.prescription.status" /></td>
                  <td><a [routerLink]="['/app/pharmacy/prescriptions', item.prescription.id]">Ver</a></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `
})
export class PrescriptionsListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly pharmacy = inject(PharmacyService);
  private readonly appointments = inject(AppointmentService);
  private readonly patients = inject(PatientService);
  readonly filters = this.fb.nonNullable.group({ status: [''] });
  readonly vm$ = combineLatest([
    this.filters.valueChanges.pipe(startWith(this.filters.getRawValue()), debounceTime(150))
  ]).pipe(
    map(([filters]) => filters),
    switchMap((filters) =>
      forkJoin({
        prescriptions: this.pharmacy.prescriptions(filters),
        appointments: this.appointments.list(),
        patients: this.patients.list()
      })
    ),
    map(({ prescriptions, appointments, patients }) =>
      prescriptions.map((prescription) => {
        const appointment = appointments.find((item) => item.id === prescription.appointmentId);
        return {
          prescription,
          patient:
            patients.find((patient) => patient.id === appointment?.patientId)?.fullName ??
            'Paciente no encontrado'
        };
      })
    )
  );
}
