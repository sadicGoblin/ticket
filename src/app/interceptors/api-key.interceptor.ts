import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  // Only add API key to requests going to our backend API
  if (req.url.startsWith(environment.apiUrl)) {
    const cloned = req.clone({
      setHeaders: {
        'x-api-key': environment.apiKey,
      },
    });
    return next(cloned);
  }
  return next(req);
};
