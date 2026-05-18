import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <section class="page">
      <div class="page-title">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen operativo segun el rol {{ session()?.user?.role }}.</p>
        </div>
      </div>

      @if (cards$ | async; as cards) {
        <div class="metric-grid">
          @for (card of cards; track card.label) {
            <article class="metric-card" [class]="card.tone">
              <span>{{ card.label }}</span>
              <strong>{{ card.value }}</strong>
            </article>
          }
        </div>
      } @else {
        <div class="loading">Cargando indicadores...</div>
      }
    </section>
  `
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly dashboard = inject(DashboardService);
  readonly session = this.auth.session;
  readonly cards$ = this.dashboard.cardsForRole(this.auth.currentUser()?.role ?? 'AUDITOR');
}
