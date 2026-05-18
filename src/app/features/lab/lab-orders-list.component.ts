import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { combineLatest, debounceTime, forkJoin, map, startWith, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { LabService } from '../../core/services/lab.service';
import { PatientService } from '../../core/services/patient.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-lab-orders-list',
  standalone: true,
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule, RouterLink, StatusBadgeComponent],
  template: `
    <section class="page">
      <div class="page-title">
        <div><h1>Laboratorio</h1><p>Ordenes pendientes y completadas.</p></div>
      </div>
      <form class="toolbar" [formGroup]="filters">
        <select formControlName="status">
          <option value="">Todos</option>
          <option value="PENDING">Pendiente</option>
          <option value="COMPLETED">Completada</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
        <select formControlName="priority">
          <option value="">Todas las prioridades</option>
          <option value="ROUTINE">Routine</option>
          <option value="URGENT">Urgente</option>
        </select>
      </form>
      @if (vm$ | async; as vm) {
        <div class="table-wrap">
          <table>
            <thead><tr><th>Solicitada</th><th>Paciente</th><th>Prueba</th><th>Prioridad</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              @for (item of vm; track item.order.id) {
                <tr>
                  <td>{{ item.order.requestedAt | date: 'short' }}</td>
                  <td>{{ item.patient }}</td>
                  <td>{{ item.order.testName }}</td>
                  <td>{{ item.order.priority }}</td>
                  <td><app-status-badge [value]="item.order.status" /></td>
                  <td><a [routerLink]="['/app/lab/orders', item.order.id]">Ver</a></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `
})
export class LabOrdersListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly lab = inject(LabService);
  private readonly appointments = inject(AppointmentService);
  private readonly patients = inject(PatientService);
  private readonly auth = inject(AuthService);
  readonly filters = this.fb.nonNullable.group({ status: [''], priority: [''] });
  readonly vm$ = combineLatest([
    this.filters.valueChanges.pipe(startWith(this.filters.getRawValue()), debounceTime(150))
  ]).pipe(
    map(([filters]) => filters),
    switchMap((filters) =>
      forkJoin({
        orders: this.lab.list(filters),
        appointments: this.appointments.list(),
        patients: this.patients.list()
      })
    ),
    map(({ orders, appointments, patients }) =>
      orders
        .filter((order) =>
          this.auth.currentUser()?.role === 'MEDICO'
            ? appointments.find((appointment) => appointment.id === order.appointmentId)?.doctorId ===
              order.doctorId
            : true
        )
        .map((order) => {
          const appointment = appointments.find((item) => item.id === order.appointmentId);
          return {
            order,
            patient:
              patients.find((patient) => patient.id === appointment?.patientId)?.fullName ??
              'Paciente no encontrado'
          };
        })
    )
  );
}
