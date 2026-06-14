import { inject }          from '@angular/core';
import { CanActivateFn }   from '@angular/router';
import { Router }          from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take }       from 'rxjs/operators';

/**
 * Functional route guard (Angular 15+ style — no class needed).
 *
 * Checks if there is a currently authenticated Firebase user.
 * - Authenticated  → allows navigation to /admin/dashboard
 * - Not authenticated → redirects to /admin/login
 *
 * Uses `take(1)` to convert the continuous authState$ stream into a
 * single-emission Observable, which is what CanActivateFn expects.
 */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),                           // complete after first emission
    map(user => {
      if (user) {
        return true;                   // authenticated — allow access
      }
      // Not authenticated — cancel navigation and go to login
      return router.createUrlTree(['/admin/login']);
    }),
  );
};
