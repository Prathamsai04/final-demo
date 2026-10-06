// Date helpers that operate on ISO calendar dates (YYYY-MM-DD) in UTC to avoid timezone drift.
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isISODate(value) {
  if (typeof value !== 'string' || !ISO_RE.test(value)) return false;
  const d = parseISODate(value);
  return !Number.isNaN(d.getTime()) && toISODate(d) === value;
}

export function parseISODate(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function todayISO(now = new Date()) {
  return toISODate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function addDays(iso, days) {
  return toISODate(new Date(parseISODate(iso).getTime() + days * DAY_MS));
}

export function diffDays(fromIso, toIso) {
  return Math.round((parseISODate(toIso).getTime() - parseISODate(fromIso).getTime()) / DAY_MS);
}

export function nightsBetween(checkIn, checkOut) {
  return diffDays(checkIn, checkOut);
}

/** Every night (by check-in date) of a stay: [checkIn, checkOut). */
export function eachNight(checkIn, checkOut) {
  const nights = [];
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) nights.push(d);
  return nights;
}

/** Half-open ranges [aStart, aEnd) and [bStart, bEnd) overlap. ISO strings compare lexicographically. */
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function isWeekendNight(iso) {
  const day = parseISODate(iso).getUTCDay();
  return day === 5 || day === 6; // Friday & Saturday nights
}

export function formatDisplayDate(iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!iso) return '';
  return parseISODate(iso).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
}
