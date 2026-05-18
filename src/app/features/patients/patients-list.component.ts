import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, debounceTime, delay, map, mergeMap, startWith } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PatientService } from '../../core/services/patient.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-patients-list',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, RouterLink, EmptyStateComponent],
  template: `
    <section class="page">
      <div class="page-title">
        <div>
          <h1>Pacientes</h1>
          <p>Busqueda por nombre o documento.</p>
        </div>
        @if (session()?.user?.role !== 'AUDITOR') {
          <a class="button" routerLink="/app/patients/new">Nuevo paciente</a>
        }
      </div>

      <form class="toolbar" [formGroup]="filters">
        <input type="search" placeholder="Nombre o documento" formControlName="q" />
        <select formControlName="active">
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </form>

      @if (patients$ | async; as patients) {
        @if (patients.length) {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Paciente</th>
                  <th>Telefono</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (patient of patients; track patient.id) {
                  <tr>
                    <td>{{ patient.documentNumber }}</td>
                    <td>{{ patient.fullName }}</td>
                    <td>{{ patient.phone || '-' }}</td>
                    <td>{{ patient.active ? 'Activo' : 'Inactivo' }}</td>
                    <td><a [routerLink]="['/app/patients', patient.id]">Ver</a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-empty-state title="Sin pacientes" message="Ajusta los filtros o registra un paciente." />
        }
      } @else {
        <div class="loading">Cargando pacientes...</div>
      }
    </section>
  `
})
export class PatientsListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PatientService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  readonly session = this.auth.session;
  readonly filters = this.fb.nonNullable.group({
    q: [this.route.snapshot.queryParamMap.get('q') ?? ''],
    active: [this.route.snapshot.queryParamMap.get('active') ?? '']
  });
  readonly patients$ = combineLatest([
    this.filters.valueChanges.pipe(startWith(this.filters.getRawValue()), debounceTime(200))
  ]).pipe(
    map(([filters]) => filters),
    // Let every search request finish to keep the UI predictable.
    mergeMap((filters) => {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: filters,
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
      return this.service.list(filters).pipe(delay(Math.max(0, 260 - (filters.q?.length ?? 0) * 40)));
    })
  );
}
