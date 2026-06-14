import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }              from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { BookingService }            from '../services/booking.service';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-form.component.html',
  styleUrl: './booking-form.component.css',
})
export class BookingFormComponent implements OnInit {

  private fb             = inject(FormBuilder);
  private bookingService = inject(BookingService);

  form!: FormGroup;
  submitState: SubmitState = 'idle';
  isLoading     = false;   // explicit boolean — NOT derived from submitState
  errorMessage  = '';

  // Predefined pickup locations
  readonly pickupLocations = [
    'Airport – Arrivals Hall',
    'City Centre – Main Square',
    'Central Train Station',
    'North Bus Terminal',
    'Cruise Port',
    'Hotel Zone',
    'Other (specify in notes)',
  ];

  // ── Minimum datetime = now (no past dates) ───────────────────────────────
  get minDateTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      fullName:        ['', [Validators.required, Validators.minLength(3)]],
      whatsappNumber:  ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{6,14}$/)]],
      arrivalDateTime: ['', Validators.required],
      pickupLocation:  ['', Validators.required],
      dropoffLocation: ['', [Validators.required, Validators.minLength(3)]],
      passengers:      [1,  [Validators.required, Validators.min(1), Validators.max(50)]],
      luggage:         [0,  [Validators.required, Validators.min(0), Validators.max(50)]],
      returnTrip:      [false],
      returnDateTime:  [null],
    });

    // Toggle returnDateTime required validator based on returnTrip
    this.form.get('returnTrip')!.valueChanges.subscribe((isReturn: boolean) => {
      const ctrl = this.form.get('returnDateTime')!;
      if (isReturn) {
        ctrl.setValidators(Validators.required);
      } else {
        ctrl.clearValidators();
        ctrl.setValue(null);
      }
      ctrl.updateValueAndValidity();
    });
  }

  // ── Convenience getters ───────────────────────────────────────────────────
  get f(): Record<string, AbstractControl> {
    return this.form.controls;
  }

  get isReturnTrip(): boolean {
    return this.form.get('returnTrip')?.value === true;
  }

  // isLoading is now a plain boolean field (see top of class)
  // Kept as a comment so the template binding [disabled]="isLoading" continues to work.

  // ── Show field error only after touched ───────────────────────────────────
  hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.errors['required'])   return 'This field is required.';
    if (ctrl.errors['minlength'])  return `Minimum ${ctrl.errors['minlength'].requiredLength} characters.`;
    if (ctrl.errors['pattern'])    return 'Enter a valid number with country code (e.g. +1234567890).';
    if (ctrl.errors['min'])        return `Minimum value is ${ctrl.errors['min'].min}.`;
    if (ctrl.errors['max'])        return `Maximum value is ${ctrl.errors['max'].max}.`;
    return 'Invalid value.';
  }

  // ── Form submission (debug trace version) ────────────────────────────────
  onSubmit(): void {
    console.log('Step 1: Submit triggered');

    if (this.form.invalid) {
      console.warn('Step 2: Form is INVALID!', this.form.value);
      this.form.markAllAsTouched();
      this.isLoading = false;
      return;
    }

    console.log('Step 3: Form is VALID. Setting loading state.');
    this.isLoading    = true;
    this.submitState  = 'loading';
    this.errorMessage = '';

    console.log('Step 4: Calling Firebase service...');

    this.bookingService.createBooking(this.form.value)
      .then((docRef) => {
        console.log('Step 5: Firebase Success! Doc ID:', docRef.id);
        this.submitState = 'success';
        this.isLoading   = false;
        this.form.reset({ passengers: 1, luggage: 0, returnTrip: false });
      })
      .catch((error) => {
        console.error('Step 5: Firebase Error!', error);
        this.errorMessage = 'Something went wrong. Please try again.';
        this.submitState  = 'error';
        this.isLoading    = false;
      });
  }

  resetForm(): void {
    this.submitState = 'idle';
    this.form.reset({ passengers: 1, luggage: 0, returnTrip: false });
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }
}
