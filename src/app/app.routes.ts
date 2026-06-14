import { Routes }                  from '@angular/router';
import { BookingFormComponent }     from './booking-form/booking-form.component';
import { AdminLoginComponent }      from './admin-login/admin-login.component';
import { AdminDashboardComponent }  from './admin-dashboard/admin-dashboard.component';
import { authGuard }                from './guards/admin.guard';

export const routes: Routes = [

  // ── Public ──────────────────────────────────────────────────────────────
  // Default path — only the booking form, nothing admin-related
  {
    path: '',
    component: BookingFormComponent,
  },

  // ── Admin ────────────────────────────────────────────────────────────────
  // Login page — public but admin-only in intent
  {
    path: 'admin/login',
    component: AdminLoginComponent,
  },

  // Dashboard — protected by authGuard
  // Unauthenticated users are redirected to /admin/login
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard],
  },

  // ── Fallback ─────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: '',
  },
];
