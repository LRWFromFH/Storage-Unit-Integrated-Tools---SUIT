import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const csrfToken = auth.getCsrfToken();

  let modifiedReq = req.clone({
    withCredentials: true
  });

  const skipCsrf = req.url.includes('/api/login');

  if (csrfToken && !skipCsrf) {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        'X-CSRF-TOKEN': csrfToken
      }
    });
  }

  return next(modifiedReq);
};
