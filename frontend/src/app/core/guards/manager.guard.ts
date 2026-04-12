import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

export const managerGuard: CanActivateFn = (_route, _state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isManager()) {
    return true;
  }
  return router.createUrlTree(['/dashboard']);
};
