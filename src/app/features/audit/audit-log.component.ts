import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, debounceTime, forkJoin, map, startWith, switchMap } from 'rxjs';
import { AuditLogService } from '../../core/services/audit-log.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule],
  template: `
    <section class="page">
      <div class="page-title"><div><h1>Auditoria</h1><p>Registro de acciones del sistema.</p></div></div>
      <form class="toolbar" [formGroup]="filters">
        <input placeholder="Entidad" formControlName="entityType" />
        <input placeholder="Accion" formControlName="action" />
        <select formControlName="userId">
          <option value="">Todos los usuarios</option>
          @for (user of users$ | async; track user.id) {
            <option [value]="user.id">{{ user.fullName }}</option>
          }
        </select>
        <input type="date" formControlName="date" />
      </form>
      @if (logs$ | async; as logs) {
        <div class="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Entidad</th><th>Accion</th><th>Descripcion</th><th>Usuario</th></tr></thead>
            <tbody>
              @for (log of logs.items; track log.id) {
                <tr>
                  <td>{{ log.createdAt | date: 'short' }}</td>
                  <td>{{ log.entityType }}</td>
                  <td>{{ log.action }}</td>
                  <td>{{ log.description }}</td>
                  <td>{{ logs.users.get(log.userId) || log.userId }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `
})
export class AuditLogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly audit = inject(AuditLogService);
  private readonly users = inject(UserService);
  readonly users$ = this.users.list();
  readonly filters = this.fb.nonNullable.group({
    entityType: [''],
    action: [''],
    userId: [''],
    date: ['']
  });
  readonly logs$ = combineLatest([
    this.filters.valueChanges.pipe(startWith(this.filters.getRawValue()), debounceTime(150))
  ]).pipe(
    map(([filters]) => filters),
    switchMap((filters) => forkJoin({ items: this.audit.list(filters), users: this.users.list() })),
    map(({ items, users }) => ({
      items,
      users: new Map(users.map((user) => [user.id, user.fullName]))
    }))
  );
}
