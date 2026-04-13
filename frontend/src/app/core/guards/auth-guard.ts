import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';
import { catchError, from, map, switchMap, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const http = inject(HttpClient);
  const router = inject(Router);
  const apiUrl = 'http://localhost:8080';

  if (auth.isAuthenticated()) {
    // Role may not be set yet (e.g. after a page refresh)
    if (!auth.role()) {
      return from(auth.fetchUserRole()).pipe(map(() => true));
    }
    return true;
  }

  return http.get(`${apiUrl}/api/session`, { withCredentials: true }).pipe(
    switchMap(() => {
      auth.setAuthenticated(true);
      return from(auth.fetchUserRole());
    }),
    map(() => true),
    catchError(() => {
      auth.setAuthenticated(false);
      return of(router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }));
    })
  );
};