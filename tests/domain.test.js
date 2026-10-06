import { describe, expect, it } from 'vitest';
import { addDays, eachNight, isISODate, nightsBetween, rangesOverlap } from '../shared/domain/dates.js';
import { calculatePrice } from '../shared/domain/pricing.js';
import {
  cancellationPolicy,
  findConflicts,
  isAvailable,
  unavailableNights,
  validateGuests,
  validateStayDates,
} from '../shared/domain/availability.js';
import { applyOverlay, emptyOverlay, isEmptyPatch, mergePatch, normalizeOverlay } from '../shared/overlay.js';

const TODAY = '2030-06-10'; // a Monday

describe('dates', () => {
  it('validates ISO dates', () => {
    expect(isISODate('2030-02-28')).toBe(true);
    expect(isISODate('2030-02-30')).toBe(false);
    expect(isISODate('30-02-2030')).toBe(false);
  });
  it('adds days across month boundaries and counts nights', () => {
    expect(addDays('2030-01-31', 1)).toBe('2030-02-01');
    expect(nightsBetween('2030-03-30', '2030-04-02')).toBe(3);
    expect(eachNight('2030-03-30', '2030-04-01')).toEqual(['2030-03-30', '2030-03-31']);
  });
  it('treats ranges as half-open (back-to-back stays do not overlap)', () => {
    expect(rangesOverlap('2030-01-01', '2030-01-05', '2030-01-05', '2030-01-07')).toBe(false);
    expect(rangesOverlap('2030-01-01', '2030-01-05', '2030-01-04', '2030-01-07')).toBe(true);
    expect(rangesOverlap('2030-01-02', '2030-01-03', '2030-01-01', '2030-01-07')).toBe(true);
  });
});

describe('pricing', () => {
  const property = { pricePerNight: 100, weekendPrice: 150, cleaningFee: 30 };
  it('applies weekend rates to Friday and Saturday nights', () => {
    // Thu 13 → Sun 16: nights Thu(100), Fri(150), Sat(150)
    const p = calculatePrice(property, '2030-06-13', '2030-06-16');
    expect(p.nights).toBe(3);
    expect(p.subtotal).toBe(400);
    expect(p.nightly.filter((n) => n.weekend)).toHaveLength(2);
  });
  it('computes fees, taxes and total with cent rounding', () => {
    const p = calculatePrice({ pricePerNight: 99.99, cleaningFee: 10 }, '2030-06-10', '2030-06-12');
    expect(p.subtotal).toBe(199.98);
    expect(p.serviceFee).toBe(20);
    expect(p.taxes).toBe(25.2); // (199.98 + 10) * 0.12 = 25.1976
    expect(p.total).toBe(255.18);
  });
  it('uses the nightly price when no weekend price is set', () => {
    expect(calculatePrice({ pricePerNight: 80 }, '2030-06-14', '2030-06-16').subtotal).toBe(160);
  });
});

describe('stay validation', () => {
  it('rejects past, inverted, empty and overly long stays', () => {
    expect(validateStayDates('', '', TODAY)).toMatch(/select/i);
    expect(validateStayDates('2030-06-09', '2030-06-12', TODAY)).toMatch(/past/);
    expect(validateStayDates('2030-06-12', '2030-06-12', TODAY)).toMatch(/after/);
    expect(validateStayDates('2030-06-12', '2030-06-11', TODAY)).toMatch(/after/);
    expect(validateStayDates('2030-06-12', '2030-07-20', TODAY)).toMatch(/Maximum/);
    expect(validateStayDates('2032-06-12', '2032-06-14', TODAY)).toMatch(/one year/);
    expect(validateStayDates('2030-06-10', '2030-06-11', TODAY)).toBeNull();
  });
  it('enforces guest capacity', () => {
    expect(validateGuests(0, { maxGuests: 4 })).toMatch(/At least/);
    expect(validateGuests(5, { maxGuests: 4 })).toMatch(/up to 4/);
    expect(validateGuests(4, { maxGuests: 4 })).toBeNull();
  });
});

describe('availability', () => {
  const property = { id: 'p1', blockedDates: [{ start: '2030-07-01', end: '2030-07-03' }] };
  const bookings = [
    { id: 'b1', propertyId: 'p1', checkIn: '2030-06-15', checkOut: '2030-06-18', status: 'confirmed' },
    { id: 'b2', propertyId: 'p1', checkIn: '2030-06-20', checkOut: '2030-06-22', status: 'cancelled' },
    { id: 'b3', propertyId: 'p2', checkIn: '2030-06-15', checkOut: '2030-06-18', status: 'confirmed' },
    { id: 'b4', propertyId: 'p1', checkIn: '2030-06-25', checkOut: '2030-06-27', status: 'pending' },
  ];
  it('detects overlapping confirmed and pending bookings only for the same property', () => {
    expect(findConflicts(bookings, 'p1', '2030-06-17', '2030-06-19').map((b) => b.id)).toEqual(['b1']);
    expect(findConflicts(bookings, 'p1', '2030-06-20', '2030-06-22')).toHaveLength(0);
    expect(findConflicts(bookings, 'p1', '2030-06-26', '2030-06-28').map((b) => b.id)).toEqual(['b4']);
    expect(findConflicts(bookings, 'p1', '2030-06-17', '2030-06-19', { excludeBookingId: 'b1' })).toHaveLength(0);
  });
  it('respects owner-blocked dates and allows back-to-back stays', () => {
    expect(isAvailable(property, bookings, '2030-07-02', '2030-07-04')).toBe(false);
    expect(isAvailable(property, bookings, '2030-06-18', '2030-06-20')).toBe(true);
  });
  it('lists unavailable nights', () => {
    const nights = unavailableNights(property, bookings, '2030-06-10', 30);
    expect(nights).toContain('2030-06-15');
    expect(nights).toContain('2030-06-17');
    expect(nights).not.toContain('2030-06-18');
    expect(nights).not.toContain('2030-06-20');
    expect(nights).toContain('2030-07-01');
  });
});

describe('cancellation policy', () => {
  const booking = { status: 'confirmed', checkIn: '2030-06-20', price: { total: 500 } };
  it('gives full refunds 2+ days before check-in and 50% after', () => {
    expect(cancellationPolicy(booking, '2030-06-10')).toMatchObject({ eligible: true, refundAmount: 500 });
    expect(cancellationPolicy(booking, '2030-06-19')).toMatchObject({ eligible: true, refundAmount: 250 });
  });
  it('blocks cancellation of started or non-active bookings', () => {
    expect(cancellationPolicy(booking, '2030-06-20').eligible).toBe(false);
    expect(cancellationPolicy({ ...booking, status: 'completed' }, '2030-06-10').eligible).toBe(false);
  });
});

describe('demo overlay', () => {
  const seed = { users: [{ id: 'u1', name: 'A' }], properties: [{ id: 'p1' }, { id: 'p2' }], bookings: [] };
  it('applies upserts and deletions over seed data', () => {
    const overlay = { ...emptyOverlay(), users: { u1: { id: 'u1', name: 'B' }, u2: { id: 'u2', name: 'C' } }, properties: { p2: null } };
    const state = applyOverlay(seed, overlay);
    expect(state.users.map((u) => u.name)).toEqual(['B', 'C']);
    expect(state.properties.map((p) => p.id)).toEqual(['p1']);
  });
  it('merges patches and ignores invalid overlays', () => {
    const merged = mergePatch(emptyOverlay(), { bookings: { b1: { id: 'b1' } } });
    expect(Object.keys(merged.bookings)).toEqual(['b1']);
    expect(normalizeOverlay({ version: 999, users: { x: {} } })).toEqual(emptyOverlay());
    expect(normalizeOverlay('garbage')).toEqual(emptyOverlay());
    expect(isEmptyPatch(emptyOverlay())).toBe(true);
  });
});
