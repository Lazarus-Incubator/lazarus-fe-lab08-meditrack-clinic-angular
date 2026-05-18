import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        error.status === 0
          ? 'No se pudo conectar con la fake API. Verifica que npm run api este activo.'
          : error.message || 'Ocurrio un error procesando la solicitud.';
      return throwError(() => new Error(message));
    })
  );
};
