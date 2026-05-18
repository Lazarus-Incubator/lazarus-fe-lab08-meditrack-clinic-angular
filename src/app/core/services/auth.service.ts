import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { Session, User } from '../models/domain.models';
import { ApiService } from './api.service';

const STORAGE_KEY = 'meditrack-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly sessionSignal = signal<Session | null>(null);

  readonly session = this.sessionSignal.asReadonly();

  constructor() {
    // Restore the session before resolving protected views.
    setTimeout(() => this.sessionSignal.set(this.restoreSession()), 0);
  }

  login(email: string, password: string): Observable<Session> {
    return this.api.get<User[]>('users', { email, password, active: true }).pipe(
      map((users) => {
        const user = users[0];
        if (!user) {
          throw new Error('Credenciales invalidas o usuario inactivo.');
        }
        return { user, loggedAt: new Date().toISOString() };
      }),
      tap((session) => this.setSession(session))
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.sessionSignal.set(null);
    void this.router.navigate(['/login']);
  }

  currentUser(): User | null {
    return this.sessionSignal()?.user ?? null;
  }

  setSession(session: Session): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.sessionSignal.set(session);
  }

  private restoreSession(): Session | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as Session;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}
