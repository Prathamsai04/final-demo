import { addDays, diffDays, eachNight, isISODate, nightsBetween, rangesOverlap, todayISO } from './dates.js';
import { round2 } from './pricing.js';

export const MIN_NIGHTS = 1;
export const MAX_NIGHTS = 30;
export const MAX_ADVANCE_DAYS = 365;
export const FREE_CANCELLATION_DAYS = 2;

/** Booking statuses that hold dates on the calendar. */
export const BLOCKING_STATUSES = ['pending', 'confirmed'];
export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'];

/** Returns an error message for an invalid stay, or null when the dates are valid. */
export function validateStayDates(checkIn, checkOut, today = todayISO()) {
  if (!checkIn || !checkOut) return 'Please select check-in and check-out dates.';
  if (!isISODate(checkIn) || !isISODate(checkOut)) return 'Dates must be valid calendar dates (YYYY-MM-DD).';
  if (checkIn < today) return 'Check-in date cannot be in the past.';
  if (checkOut <= checkIn) return 'Check-out must be after check-in.';
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < MIN_NIGHTS) return `Minimum stay is ${MIN_NIGHTS} night.`;
  if (nights > MAX_NIGHTS) return `Maximum stay is ${MAX_NIGHTS} nights.`;
  if (diffDays(today, checkIn) > MAX_ADVANCE_DAYS) return 'Bookings can be made up to one year in advance.';
  return null;
}

export function validateGuests(guests, property) {
  const n = Number(guests);
  if (!Number.isInteger(n) || n < 1) return 'At least one guest is required.';
  if (property && n > Number(property.maxGuests)) return `This home allows up to ${property.maxGuests} guests.`;
  return null;
}

/** Returns bookings that conflict with the requested stay. */
export function findConflicts(bookings, propertyId, checkIn, checkOut, { excludeBookingId, statuses = BLOCKING_STATUSES } = {}) {
  return bookings.filter(
    (b) =>
      b.propertyId === propertyId &&
      b.id !== excludeBookingId &&
      statuses.includes(b.status) &&
      rangesOverlap(checkIn, checkOut, b.checkIn, b.checkOut),
  );
}

/** Owner-blocked ranges that conflict with the requested stay. */
export function findBlockedConflicts(property, checkIn, checkOut) {
  return (property.blockedDates || []).filter((r) => rangesOverlap(checkIn, checkOut, r.start, r.end));
}

export function isAvailable(property, bookings, checkIn, checkOut, opts) {
  return findConflicts(bookings, property.id, checkIn, checkOut, opts).length === 0 && findBlockedConflicts(property, checkIn, checkOut).length === 0;
}

/** List of unavailable nights (ISO dates) for calendar display. */
export function unavailableNights(property, bookings, from = todayISO(), days = 180) {
  const to = addDays(from, days);
  const set = new Set();
  const add = (start, end) => {
    const s = start < from ? from : start;
    const e = end > to ? to : end;
    if (s < e) eachNight(s, e).forEach((d) => set.add(d));
  };
  bookings.filter((b) => b.propertyId === property.id && BLOCKING_STATUSES.includes(b.status)).forEach((b) => add(b.checkIn, b.checkOut));
  (property.blockedDates || []).forEach((r) => add(r.start, r.end));
  return [...set].sort();
}

/** Determines whether a booking can be cancelled by the guest and the refund owed. */
export function cancellationPolicy(booking, today = todayISO()) {
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return { eligible: false, reason: `Bookings that are ${booking.status} cannot be cancelled.`, refundAmount: 0, refundPercent: 0 };
  }
  if (booking.checkIn <= today) {
    return { eligible: false, reason: 'Stays that have already started cannot be cancelled.', refundAmount: 0, refundPercent: 0 };
  }
  const daysBefore = diffDays(today, booking.checkIn);
  const total = Number(booking.price?.total || 0);
  if (booking.status === 'pending' || daysBefore >= FREE_CANCELLATION_DAYS) {
    return { eligible: true, reason: 'Free cancellation — full refund.', refundAmount: round2(total), refundPercent: 100 };
  }
  return { eligible: true, reason: 'Late cancellation — 50% refund.', refundAmount: round2(total * 0.5), refundPercent: 50 };
}

export function validateBlockedRange(range) {
  if (!range || !isISODate(range.start) || !isISODate(range.end)) return 'Blocked dates must be valid dates.';
  if (range.end <= range.start) return 'Blocked range end must be after start.';
  return null;
}
