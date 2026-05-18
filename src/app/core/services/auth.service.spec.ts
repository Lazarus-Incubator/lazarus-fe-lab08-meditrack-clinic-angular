import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { User } from '../models/domain.models';

describe('AuthService', () => {
  const user: User = {
    id: 'u-test',
    fullName: 'Usuario Test',
    email: 'test@meditrack.pe',
    password: 'Admin123*',
    role: 'ADMIN',
    active: true
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.clear();
  });

  it('guarda y restaura la sesion', () => {
    const service = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    service.login(user.email, user.password).subscribe((session) => {
      expect(session.user.email).toBe(user.email);
    });

    const req = http.expectOne((request) => request.url.endsWith('/users'));
    expect(req.request.params.get('email')).toBe(user.email);
    req.flush([user]);

    const restored = TestBed.inject(AuthService).currentUser();
    expect(restored?.email).toBe(user.email);
    expect(localStorage.getItem('meditrack-session')).toContain(user.email);
  });
});
