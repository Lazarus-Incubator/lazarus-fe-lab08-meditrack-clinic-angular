import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, forkJoin, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-prescription-detail',
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterLink, StatusBadgeComponent],
  template: `
    <section class="page narrow">
      @if (vm$ | async; as vm) {
        <div class="page-title">
          <div><h1>Receta {{ vm.prescription.id }}</h1><p>{{ vm.prescription.createdAt | date: 'short' }}</p></div>
          <a class="secondary" routerLink="/app/pharmacy/prescriptions">Volver</a>
        </div>
        @if (error()) { <div class="alert">{{ error() }}</div> }
        <article class="card">
          <div class="section-heading">
            <h2>Medicamentos</h2>
            <app-status-badge [value]="vm.prescription.status" />
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Medicamento</th><th>Cantidad</th><th>Stock</th><th>Indicaciones</th></tr></thead>
              <tbody>
                @for (item of vm.prescription.items; track item.medicationId) {
                  <tr>
                    <td>{{ medicationName(vm.medications, item.medicationId) }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ medicationStock(vm.medications, item.medicationId) }}</td>
                    <td>{{ item.instructions }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if ((session()?.user?.role === 'FARMACIA' || session()?.user?.role === 'ADMIN') && vm.prescription.status === 'PENDING') {
            <button type="button" (click)="dispense(vm.prescription)" [disabled]="saving()">
              {{ saving() ? 'Despachando...' : 'Despachar receta' }}
            </button>
          }
        </article>
      }
    </section>
  `
})
export class PrescriptionDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly pharmacy = inject(PharmacyService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new BehaviorSubject<void>(undefined);
  readonly session = this.auth.session;
  readonly saving = signal(false);
  readonly error = signal('');
  readonly vm$ = this.reload.pipe(
    switchMap(() => this.route.paramMap),
    switchMap((params) =>
      forkJoin({
        prescription: this.pharmacy.prescription(params.get('id') ?? ''),
        medications: this.pharmacy.medications()
      })
    )
  );

  medicationName(medications: { id: string; name: string }[], id: string): string {
    return medications.find((medication) => medication.id === id)?.name ?? 'No encontrado';
  }

  medicationStock(medications: { id: string; stock: number }[], id: string): number {
    return medications.find((medication) => medication.id === id)?.stock ?? 0;
  }

  dispense(prescription: Parameters<PharmacyService['dispense']>[0]): void {
    const user = this.auth.currentUser();
    if (!user || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.pharmacy
      .dispense(prescription, user)
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
