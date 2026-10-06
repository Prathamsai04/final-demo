import { BLOCKING_STATUSES, isAvailable, unavailableNights } from '../../shared/domain/availability.js';
import { todayISO } from '../../shared/domain/dates.js';
import { calculatePrice } from '../../shared/domain/pricing.js';
import { paginate } from '../utils.js';

export function presentOwner(user) {
  return user ? { id: user.id, name: user.name, avatar: user.avatar, createdAt: user.createdAt } : null;
}

export function presentProperty(property, { usersById, bookings } = {}) {
  const result = { ...property };
  if (usersById) result.owner = presentOwner(usersById.get(property.ownerId));
  if (bookings) {
    const today = todayISO();
    result.upcomingBookings = bookings.filter((b) => b.propertyId === property.id && BLOCKING_STATUSES.includes(b.status) && b.checkOut > today).length;
  }
  return result;
}

const SORTERS = {
  recommended: (a, b) => b.rating * Math.log10(b.reviewCount + 10) - a.rating * Math.log10(a.reviewCount + 10),
  price_asc: (a, b) => a.pricePerNight - b.pricePerNight,
  price_desc: (a, b) => b.pricePerNight - a.pricePerNight,
  rating: (a, b) => b.rating - a.rating,
  newest: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
};

/** Public property search with filters, availability and pagination. */
export async function searchProperties(repo, q) {
  const [properties, bookings, users] = await Promise.all([repo.listProperties(), repo.listBookings(), repo.listUsers()]);
  const usersById = new Map(users.map((u) => [u.id, u]));
  const destination = q.destination?.trim().toLowerCase();
  const amenities = q.amenities || [];

  let results = properties.filter((p) => p.status === 'active');
  if (destination) {
    results = results.filter((p) => [p.city, p.country, p.title, p.address].some((v) => String(v || '').toLowerCase().includes(destination)));
  }
  if (q.guests) results = results.filter((p) => p.maxGuests >= q.guests);
  if (q.minPrice != null) results = results.filter((p) => p.pricePerNight >= q.minPrice);
  if (q.maxPrice != null) results = results.filter((p) => p.pricePerNight <= q.maxPrice);
  if (q.type) results = results.filter((p) => p.type === q.type);
  if (amenities.length) results = results.filter((p) => amenities.every((a) => p.amenities.includes(a)));
  if (q.checkIn && q.checkOut) results = results.filter((p) => isAvailable(p, bookings, q.checkIn, q.checkOut));

  results.sort(SORTERS[q.sort] || SORTERS.recommended);
  const page = paginate(results, q.page, q.pageSize);
  page.items = page.items.map((p) => {
    const item = presentProperty(p, { usersById });
    if (q.checkIn && q.checkOut) item.quote = calculatePrice(p, q.checkIn, q.checkOut);
    return item;
  });
  const destinations = [...new Set(properties.filter((p) => p.status === 'active').map((p) => `${p.city}, ${p.country}`))].sort();
  return { ...page, destinations };
}

export async function getAvailability(repo, property) {
  const bookings = await repo.listBookings();
  return {
    propertyId: property.id,
    unavailableNights: unavailableNights(property, bookings),
    blockedDates: property.blockedDates || [],
  };
}
