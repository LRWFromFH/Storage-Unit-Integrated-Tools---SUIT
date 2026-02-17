import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const token = auth.getToken();

  const skipAuth =
    req.url.includes('/api/login') ||
    req.url.includes('/api/register');

  let modifiedReq = req;

  if (token && !skipAuth) {
    modifiedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true
    });
  } else {
    modifiedReq = req.clone({
      withCredentials: true
    });
  }

  return next(modifiedReq);
};
