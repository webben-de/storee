import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiAuthService } from './api-auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(ApiAuthService);
  const token = auth.token;

  // Only attach to API requests — not i18n assets or other relative paths
  if (token && req.url.startsWith('/api/')) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
