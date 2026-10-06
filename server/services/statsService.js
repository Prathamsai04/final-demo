import { addDays, diffDays, todayISO } from '../../shared/domain/dates.js';
import { round2 } from '../../shared/domain/pricing.js';

const REVENUE_STATUSES = ['confirmed', 'completed'];

/** Aggregate statistics for a set of properties/bookings (used by admin and owner dashboards). */
export function computeStats({ properties, bookings, users }) {
  const today = todayISO();
  const byStatus = { pending: 0, confirmed: 0, cancelled: 0, completed: 0, rejected: 0 };
  bookings.forEach((b) => (byStatus[b.status] = (byStatus[b.status] || 0) + 1));
  const revenueBookings = bookings.filter((b) => REVENUE_STATUSES.includes(b.status));
  const revenue = round2(revenueBookings.reduce((s, b) => s + Number(b.price?.total || 0), 0));

  // Occupancy over the next 30 days across active properties.
  const windowEnd = addDays(today, 30);
  const active = properties.filter((p) => p.status === 'active');
  let bookedNights = 0;
  revenueBookings.forEach((b) => {
    const s = b.checkIn > today ? b.checkIn : today;
    const e = b.checkOut < windowEnd ? b.checkOut : windowEnd;
    if (s < e) bookedNights += diffDays(s, e);
  });
  const occupancyRate = active.length ? round2((bookedNights / (active.length * 30)) * 100) : 0;

  // Revenue by month (check-in month) for the last 6 months + next 3.
  const months = [];
  const base = new Date(`${today}T00:00:00Z`);
  for (let i = -5; i <= 3; i++) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + i, 1));
    months.push(d.toISOString().slice(0, 7));
  }
  const revenueByMonth = months.map((m) => ({
    month: m,
    revenue: round2(revenueBookings.filter((b) => b.checkIn.startsWith(m)).reduce((s, b) => s + Number(b.price?.total || 0), 0)),
    bookings: bookings.filter((b) => b.checkIn.startsWith(m)).length,
  }));

  const propRevenue = new Map();
  revenueBookings.forEach((b) => propRevenue.set(b.propertyId, (propRevenue.get(b.propertyId) || 0) + Number(b.price?.total || 0)));
  const topProperties = [...propRevenue.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, rev]) => {
      const p = properties.find((x) => x.id === id);
      return { id, title: p?.title || 'Deleted property', city: p?.city, revenue: round2(rev) };
    });

  return {
    totals: {
      properties: properties.length,
      activeProperties: active.length,
      bookings: bookings.length,
      upcomingBookings: bookings.filter((b) => ['pending', 'confirmed'].includes(b.status) && b.checkIn >= today).length,
      users: users?.length,
      guests: users?.filter((u) => u.role === 'guest').length,
      owners: users?.filter((u) => u.role === 'owner').length,
      revenue,
      averageBookingValue: revenueBookings.length ? round2(revenue / revenueBookings.length) : 0,
      occupancyRate,
    },
    bookingsByStatus: byStatus,
    revenueByMonth,
    topProperties,
  };
}
