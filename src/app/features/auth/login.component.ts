import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="login-page">
      <section class="login-panel">
        <div class="login-copy">
          <div class="brand large">
            <div class="brand-mark">M</div>
            <div>
              <strong>MediTrack</strong>
              <span>Clinic</span>
            </div>
          </div>
          <h1>Gestion operativa academica de clinica ambulatoria</h1>
          <p>
            Entorno ficticio para laboratorio avanzado de frontend. No usa datos reales ni brinda
            diagnosticos.
          </p>
        </div>

        <form class="card login-card" [formGroup]="form" (ngSubmit)="submit()">
          <h2>Iniciar sesion</h2>
          @if (error()) {
            <div class="alert">{{ error() }}</div>
          }
          <label>
            Email
            <input type="email" formControlName="email" autocomplete="username" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <small>Ingresa un email valido.</small>
            }
          </label>
          <label>
            Password
            <input type="password" formControlName="password" autocomplete="current-password" />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <small>La contrasena es obligatoria.</small>
            }
          </label>
          <button type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Validando...' : 'Entrar' }}
          </button>
        </form>
      </section>
    </main>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.auth
      .login(this.form.controls.email.value, this.form.controls.password.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate(['/app/dashboard']),
        error: (error: Error) => {
          this.error.set(error.message);
          this.loading.set(false);
        }
      });
  }
}
