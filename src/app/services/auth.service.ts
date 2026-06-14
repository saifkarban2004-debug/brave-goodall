import { Injectable, inject }          from '@angular/core';
import { Router }                        from '@angular/router';
import { Auth, authState }               from '@angular/fire/auth';
import {
  signInWithEmailAndPassword,
  signOut,
  User,
}                                        from '@angular/fire/auth';
import { Observable }                    from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private auth   = inject(Auth);
  private router = inject(Router);

  // ── Live auth state stream ─────────────────────────────────────────────────
  // Emits the current User object when logged in, or null when logged out.
  // The AuthGuard subscribes to this to make routing decisions.
  readonly currentUser$: Observable<User | null> = authState(this.auth);

  // ── Login ─────────────────────────────────────────────────────────────────
  /**
   * Sign in with email + password.
   * Returns the raw Promise from signInWithEmailAndPassword so the caller
   * can attach its own .then()/.catch() for UI feedback.
   * On success, the caller navigates to /admin/dashboard.
   */
  login(email: string, password: string): Promise<unknown> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  /**
   * Sign out the current user and redirect to /admin/login.
   */
  logout(): Promise<void> {
    return signOut(this.auth).then(() => {
      this.router.navigate(['/admin/login']);
    });
  }
}
