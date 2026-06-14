import { Component, inject }        from '@angular/core';
import { CommonModule }              from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
}                                    from '@angular/forms';
import { Router }                    from '@angular/router';
import { AuthService }               from '../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
})
export class AdminLoginComponent {

  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);
  private router      = inject(Router);

  // ── Form ─────────────────────────────────────────────────────────────────
  form: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // ── UI State ──────────────────────────────────────────────────────────────
  isLoading     = false;
  errorMessage  = '';
  showPassword  = false;

  // ── Helpers ───────────────────────────────────────────────────────────────
  hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  getError(field: string): string {
    const errors = this.form.get(field)?.errors;
    if (!errors) return '';
    if (errors['required'])   return 'This field is required.';
    if (errors['email'])      return 'Enter a valid email address.';
    if (errors['minlength'])  return 'Password must be at least 6 characters.';
    return 'Invalid value.';
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';

    const { email, password } = this.form.value;

    this.authService.login(email, password)
      .then(() => {
        this.router.navigate(['/admin/dashboard']);
      })
      .catch((err: { code: string }) => {
        // Map Firebase error codes to friendly messages
        this.errorMessage = this.mapFirebaseError(err.code);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private mapFirebaseError(code: string): string {
    const map: Record<string, string> = {
      'auth/invalid-credential':    'Incorrect email or password.',
      'auth/user-not-found':        'No admin account found with this email.',
      'auth/wrong-password':        'Incorrect password. Please try again.',
      'auth/invalid-email':         'The email address is not valid.',
      'auth/too-many-requests':     'Too many attempts. Account temporarily locked.',
      'auth/network-request-failed':'Network error. Check your connection.',
      'auth/user-disabled':         'This account has been disabled.',
    };
    return map[code] ?? `Authentication failed (${code}).`;
  }
}
