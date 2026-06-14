import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  DocumentReference,
  Timestamp,
} from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Observable }     from 'rxjs';

// ── Booking statuses ──────────────────────────────────────────────────────────
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// ── Shape of data written to Firestore ───────────────────────────────────────
export interface BookingData {
  fullName:         string;
  whatsappNumber:   string;
  arrivalDateTime:  string;
  pickupLocation:   string;
  dropoffLocation:  string;
  passengers:       number;
  luggage:          number;
  returnTrip:       boolean;
  returnDateTime?:  string | null;
}

// ── Shape of a document read back from Firestore (includes meta fields) ───────
export interface Booking extends BookingData {
  id:        string;           // Firestore document ID (injected via idField)
  status:    BookingStatus;
  createdAt: Timestamp | null; // Firestore Timestamp (null until server writes)
}

@Injectable({ providedIn: 'root' })
export class BookingService {

  private firestore = inject(Firestore);

  // ── Reference to the bookings collection ─────────────────────────────────
  private get bookingsCol() {
    return collection(this.firestore, 'bookings');
  }

  // ── 1. CREATE ─────────────────────────────────────────────────────────────
  /**
   * Write a new booking lead to Firestore.
   * Returns the raw Promise<DocumentReference> — no async/await wrapper —
   * so the serverTimestamp() sentinel is never cloned or type-cast.
   */
  createBooking(data: BookingData): Promise<DocumentReference> {
    const payload = {
      fullName:        data.fullName,
      whatsappNumber:  data.whatsappNumber,
      arrivalDateTime: data.arrivalDateTime,
      pickupLocation:  data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      passengers:      data.passengers,
      luggage:         data.luggage,
      returnTrip:      data.returnTrip,
      returnDateTime:  data.returnTrip ? (data.returnDateTime ?? null) : null,
      status:          'pending' as BookingStatus,
      createdAt:       serverTimestamp(),
    };

    return addDoc(this.bookingsCol, payload);
  }

  // ── 2. READ (real-time) ───────────────────────────────────────────────────
  /**
   * Returns a live Observable of all bookings, newest first.
   * Uses collectionData() from @angular/fire which wraps onSnapshot() and
   * replays on every Firestore change — no manual subscription management.
   *
   * idField: 'id' injects the Firestore document ID into each object as .id
   */
  getAllBookings(): Observable<Booking[]> {
    const q = query(
      this.bookingsCol,
      orderBy('createdAt', 'desc'),
    );

    return collectionData(q, { idField: 'id' }) as Observable<Booking[]>;
  }

  // ── 3. UPDATE STATUS ──────────────────────────────────────────────────────
  /**
   * Update the status field of a single booking document.
   * Returns the raw Promise<void> from updateDoc() directly.
   */
  updateBookingStatus(docId: string, newStatus: BookingStatus): Promise<void> {
    const docRef = doc(this.firestore, 'bookings', docId);
    return updateDoc(docRef, { status: newStatus });
  }
}
