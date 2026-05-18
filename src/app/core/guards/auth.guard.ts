import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/domain.models';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.currentUser() ? true : router.createUrlTree(['/login']);
};

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.currentUser() ? router.createUrlTree(['/app/dashboard']) : true;
};

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();
  const roles = (route.data['roles'] ?? []) as Role[];

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  // Some clinical routes share similar access requirements.
  return roles.length === 0 || roles.includes(user.role)
    ? true
    : router.createUrlTree(['/app/access-denied']);
};
