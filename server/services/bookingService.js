import {
  cancellationPolicy,
  findBlockedConflicts,
  findConflicts,
  validateGuests,
  validateStayDates,
} from '../../shared/domain/availability.js';
import { addDays, todayISO } from '../../shared/domain/dates.js';
import { calculatePrice } from '../../shared/domain/pricing.js';
import { badRequest, conflict, forbidden, notFound, paymentDeclined } from '../errors.js';
import { newId, nowISO } from '../utils.js';

// Tolerate one day of clock/timezone difference between the browser and the server.
const serverToday = () => addDays(todayISO(), -1);

export const DECLINED_TEST_CARD = '4000000000000002';

export async function quoteStay(repo, property, { checkIn, checkOut, guests }) {
  const dateError = validateStayDates(checkIn, checkOut, serverToday());
  if (dateError) throw badRequest(dateError);
  const guestError = validateGuests(guests, property);
  if (guestError) throw badRequest(guestError);
  const bookings = await repo.listBookings();
  const conflicts = findConflicts(bookings, property.id, checkIn, checkOut);
  const blocked = findBlockedConflicts(property, checkIn, checkOut);
  return {
    available: conflicts.length === 0 && blocked.length === 0,
    price: calculatePrice(property, checkIn, checkOut),
    message: conflicts.length || blocked.length ? 'Some of the selected nights are unavailable.' : null,
  };
}

/** Simulated checkout: validates dates, capacity, availability and the (fake) card, then creates a booking. */
export async function createBooking(repo, user, input) {
  const property = await repo.getProperty(input.propertyId);
  if (!property || property.status !== 'active') throw notFound('This property is not available for booking.');
  if (property.ownerId === user.id) throw forbidden('You cannot book your own property.');

  const dateError = validateStayDates(input.checkIn, input.checkOut, serverToday());
  if (dateError) throw badRequest(dateError);
  const guestError = validateGuests(input.guests, property);
  if (guestError) throw badRequest(guestError);

  const bookings = await repo.listBookings();
  if (findConflicts(bookings, property.id, input.checkIn, input.checkOut).length || findBlockedConflicts(property, input.checkIn, input.checkOut).length) {
    throw conflict('Sorry, these dates were just booked or are unavailable. Please choose different dates.');
  }

  const cardNumber = input.payment.cardNumber.replace(/\s+/g, '');
  if (cardNumber === DECLINED_TEST_CARD) throw paymentDeclined('Your card was declined (simulated). Try 4242 4242 4242 4242.');

  const price = calculatePrice(property, input.checkIn, input.checkOut);
  const status = property.instantBook ? 'confirmed' : 'pending';
  const now = nowISO();
  return repo.createBooking({
    id: newId('b'),
    propertyId: property.id,
    guestId: user.id,
    ownerId: property.ownerId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    status,
    price,
    specialRequests: input.specialRequests || '',
    contact: { name: input.payment.cardName, email: user.email },
    payment: { method: 'card', last4: cardNumber.slice(-4), simulated: true, status: 'paid', transactionId: newId('txn') },
    createdAt: now,
    updatedAt: now,
  });
}

export async function cancelBookingAsGuest(repo, user, booking) {
  if (booking.guestId !== user.id && user.role !== 'admin') throw forbidden('You can only cancel your own bookings.');
  const policy = cancellationPolicy(booking, todayISO());
  if (!policy.eligible) throw badRequest(policy.reason);
  return repo.updateBooking(booking.id, {
    status: 'cancelled',
    cancelledAt: nowISO(),
    cancelledBy: user.id,
    refundAmount: policy.refundAmount,
    payment: { ...booking.payment, status: policy.refundAmount > 0 ? 'refunded' : 'paid' },
  });
}

const OWNER_TRANSITIONS = {
  pending: ['confirmed', 'rejected'],
  confirmed: ['cancelled', 'completed'],
  cancelled: [],
  rejected: [],
  completed: [],
};

/** Status changes by a property owner or admin. Admins may override any transition. */
export async function changeBookingStatus(repo, actor, booking, status) {
  const allowed = OWNER_TRANSITIONS[booking.status] || [];
  if (actor.role !== 'admin' && !allowed.includes(status)) {
    throw badRequest(`Cannot change a ${booking.status} booking to ${status}.`);
  }
  if (booking.status === status) throw badRequest(`Booking is already ${status}.`);
  if (status === 'completed' && booking.checkIn > todayISO()) throw badRequest('A booking can only be completed once the stay has started.');
  if (status === 'confirmed' || status === 'pending') {
    const bookings = await repo.listBookings();
    const clash = findConflicts(bookings, booking.propertyId, booking.checkIn, booking.checkOut, {
      excludeBookingId: booking.id,
      statuses: ['confirmed'],
    });
    if (clash.length) throw conflict('Another confirmed booking overlaps these dates.');
  }
  const changes = { status, statusChangedBy: actor.id };
  if (status === 'cancelled' || status === 'rejected') {
    changes.cancelledAt = nowISO();
    changes.refundAmount = booking.price?.total || 0;
    changes.payment = { ...booking.payment, status: 'refunded' };
  }
  return repo.updateBooking(booking.id, changes);
}

/** Adds property + guest summaries to bookings for display. */
export async function presentBookings(repo, bookings) {
  const [properties, users] = await Promise.all([repo.listProperties(), repo.listUsers()]);
  const propsById = new Map(properties.map((p) => [p.id, p]));
  const usersById = new Map(users.map((u) => [u.id, u]));
  const today = todayISO();
  return bookings.map((b) => {
    const p = propsById.get(b.propertyId);
    const g = usersById.get(b.guestId);
    return {
      ...b,
      property: p ? { id: p.id, title: p.title, city: p.city, country: p.country, image: p.images?.[0], ownerId: p.ownerId } : { id: b.propertyId, title: 'Deleted property' },
      guest: g ? { id: g.id, name: g.name, email: g.email, avatar: g.avatar } : { id: b.guestId, name: 'Deleted user' },
      cancellation: cancellationPolicy(b, today),
    };
  });
}

export const sortBookings = (list) => list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
