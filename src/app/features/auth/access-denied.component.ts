import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page">
      <div class="page-title">
        <div>
          <h1>Acceso denegado</h1>
          <p>Tu rol no tiene permisos para esta pantalla.</p>
        </div>
        <a class="secondary" routerLink="/app/dashboard">Volver al dashboard</a>
      </div>
    </section>
  `
})
export class AccessDeniedComponent {}
