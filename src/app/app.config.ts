import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter }                                  from '@angular/router';
import { provideFirebaseApp, initializeApp }              from '@angular/fire/app';
import { provideFirestore, getFirestore }                 from '@angular/fire/firestore';
import { provideAuth, getAuth }                           from '@angular/fire/auth';
import { environment }                                    from '../environments/environment';
import { routes }                                         from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    // ── Router ──────────────────────────────────────────────────────────────
    provideRouter(routes),

    // ── Firebase core ───────────────────────────────────────────────────────
    provideFirebaseApp(() => initializeApp(environment.firebase)),

    // ── Firestore (booking data) ────────────────────────────────────────────
    provideFirestore(() => getFirestore()),

    // ── Firebase Auth (admin login/guard) ───────────────────────────────────
    // getAuth() MUST be inside the lambda — called after initializeApp()
    provideAuth(() => getAuth()),
  ]
};
