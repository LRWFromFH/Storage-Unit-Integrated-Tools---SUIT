import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  //return router.createUrlTree(['/login']);
  return http.get(`${apiUrl}/api/session`, { withCredentials: true }).pipe(
    map(() => {
      auth['_isAuthenticated'].set(true);
      return true;
    }),
    catchError(() => {
      auth['_isAuthenticated'].set(false);
      return of(router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }));
    })
  );
};