import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <section class="page">
      <div class="page-title">
        <div>
          <h1>Perfil</h1>
          <p>Datos de la sesion actual.</p>
        </div>
      </div>
      <article class="card detail-grid">
        <div>
          <span>Nombre</span>
          <strong>{{ session()?.user?.fullName }}</strong>
        </div>
        <div>
          <span>Email</span>
          <strong>{{ session()?.user?.email }}</strong>
        </div>
        <div>
          <span>Rol</span>
          <strong>{{ session()?.user?.role }}</strong>
        </div>
        <div>
          <span>Estado</span>
          <strong>{{ session()?.user?.active ? 'Activo' : 'Inactivo' }}</strong>
        </div>
      </article>
      <button type="button" (click)="logout()">Cerrar sesion</button>
    </section>
  `
})
export class ProfileComponent {
  private readonly auth = inject(AuthService);
  readonly session = this.auth.session;

  logout(): void {
    this.auth.logout();
  }
}
