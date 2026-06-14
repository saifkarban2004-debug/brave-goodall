import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe }                from '@angular/common';
import { FormsModule }                           from '@angular/forms';
import { Subscription }                          from 'rxjs';
import {
  BookingService,
  Booking,
  BookingStatus,
}                                                from '../services/booking.service';
import { AuthService }                           from '../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

  private bookingService = inject(BookingService);
  private authService    = inject(AuthService);

  bookings:    Booking[] = [];
  isLoading    = true;
  errorMessage = '';

  // Track which row is currently being updated (shows a spinner in that row)
  updatingId: string | null = null;

  // Track which row just had its message copied (shows 'Copied! ✅' for 2s)
  copiedId: string | null = null;

  // Available status options shown in each dropdown
  readonly statusOptions: { value: BookingStatus; label: string }[] = [
    { value: 'pending',   label: '⏳ Pending'   },
    { value: 'confirmed', label: '✅ Confirmed' },
    { value: 'completed', label: '🏁 Completed' },
    { value: 'cancelled', label: '❌ Cancelled' },
  ];

  // Badge colours per status
  readonly statusClasses: Record<BookingStatus, string> = {
    pending:   'bg-amber-500/20  text-amber-300  border-amber-500/30',
    confirmed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    completed: 'bg-blue-500/20   text-blue-300   border-blue-500/30',
    cancelled: 'bg-red-500/20    text-red-300    border-red-500/30',
  };

  private sub!: Subscription;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.sub = this.bookingService.getAllBookings().subscribe({
      next: (data) => {
        this.bookings  = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load bookings:', err);
        this.errorMessage = 'Failed to load bookings. Check your Firestore rules.';
        this.isLoading    = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ── Status change handler (called on <select> change event) ───────────────
  onStatusChange(booking: Booking, newStatus: string): void {
    if (newStatus === booking.status) return; // no-op if same value

    this.updatingId = booking.id;

    this.bookingService
      .updateBookingStatus(booking.id, newStatus as BookingStatus)
      .then(() => {
        console.log(`Status updated → ${newStatus} for booking ${booking.id}`);
      })
      .catch((err) => {
        console.error('Status update failed:', err);
        this.errorMessage = `Failed to update status: ${err.message}`;
      })
      .finally(() => {
        this.updatingId = null;
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  get totalCount():     number { return this.bookings.length; }
  get pendingCount():   number { return this.bookings.filter(b => b.status === 'pending').length; }
  get confirmedCount(): number { return this.bookings.filter(b => b.status === 'confirmed').length; }
  get completedCount(): number { return this.bookings.filter(b => b.status === 'completed').length; }

  trackById(_: number, b: Booking): string { return b.id; }

  logout(): void { this.authService.logout(); }

  // ── WhatsApp click-to-chat ─────────────────────────────────────────────────
  copyConfirmationMessage(booking: Booking): void {
    const dateFormatted = this.formatDate(booking.arrivalDateTime);

    const message =
      `Hello ${booking.fullName}! 👋 Welcome to Egypt! 🇪🇬\n\n` +
      `This is a quick message to confirm your upcoming transfer with us on *${dateFormatted}*.\n\n` +
      `📍 Pickup: ${booking.pickupLocation}\n` +
      `🏁 Drop-off: ${booking.dropoffLocation}\n\n` +
      `We have noted your request for a vehicle accommodating ` +
      `*${booking.passengers}* passenger${booking.passengers !== 1 ? 's' : ''} ` +
      `and *${booking.luggage}* bag${booking.luggage !== 1 ? 's' : ''}.\n\n` +
      `💳 *Payment Details:*\n` +
      `For your convenience, payment can be made in cash directly to your driver upon arrival. ` +
      `If you prefer to pay online via a secure credit card link, please let us know!\n\n` +
      `Safe travels, and see you soon!`;

    // Strip +, spaces, dashes from phone → digits only
    const phone = booking.whatsappNumber.replace(/[\s\-+]/g, '');

    const whatsappUrl =
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');

    // Visual feedback on the button (2s)
    this.copiedId = booking.id;
    setTimeout(() => {
      if (this.copiedId === booking.id) {
        this.copiedId = null;
      }
    }, 2000);
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  }
}
