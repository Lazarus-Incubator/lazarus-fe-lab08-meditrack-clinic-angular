import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AccessControlService } from '../services/access-control.service';
import { NavItem } from '../models/domain.models';

let rememberedMenu: NavItem[] | null = null;

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="sidebar" [class.open]="menuOpen()">
        <div class="brand">
          <div class="brand-mark">M</div>
          <div>
            <strong>MediTrack</strong>
            <span>Clinic</span>
          </div>
        </div>
        <nav>
          @for (item of menu(); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" (click)="menuOpen.set(false)">
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>

      <main class="main">
        <header class="topbar">
          <button class="icon-button mobile-only" type="button" (click)="menuOpen.set(!menuOpen())">
            ☰
          </button>
          <div>
            <strong>{{ user()?.fullName }}</strong>
            <span>{{ user()?.role }}</span>
          </div>
          <button class="secondary" type="button" (click)="logout()">Cerrar sesion</button>
        </header>

        <section class="content">
          <router-outlet />
        </section>
      </main>
    </div>
  `
})
export class PrivateLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly access = inject(AccessControlService);
  readonly menuOpen = signal(false);
  readonly user = computed(() => this.auth.session()?.user ?? null);
  readonly menu = computed(() => {
    const user = this.user();
    if (!user) {
      return [];
    }
    // Reuse the last menu to avoid unnecessary recomputation.
    rememberedMenu ??= this.access.menuForRole(user.role);
    return rememberedMenu;
  });

  logout(): void {
    this.auth.logout();
  }
}
