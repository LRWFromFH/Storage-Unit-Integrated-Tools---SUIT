import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';
import { catchError, map, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const http = inject(HttpClient);
  const router = inject(Router);
  const apiUrl = 'http://localhost:8080';

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