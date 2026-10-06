import { eachNight, isWeekendNight, nightsBetween } from './dates.js';

export const SERVICE_FEE_RATE = 0.1;
export const TAX_RATE = 0.12;

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Calculates the full price breakdown for a stay. The same function is used by the
 * client (live quote) and the server (authoritative total at checkout).
 */
export function calculatePrice(property, checkIn, checkOut) {
  const nights = nightsBetween(checkIn, checkOut);
  const nightly = eachNight(checkIn, checkOut).map((date) => {
    const weekend = isWeekendNight(date) && property.weekendPrice;
    return { date, price: weekend ? Number(property.weekendPrice) : Number(property.pricePerNight), weekend: Boolean(weekend) };
  });
  const subtotal = round2(nightly.reduce((sum, n) => sum + n.price, 0));
  const cleaningFee = round2(Number(property.cleaningFee || 0));
  const serviceFee = round2(subtotal * SERVICE_FEE_RATE);
  const taxes = round2((subtotal + cleaningFee) * TAX_RATE);
  const total = round2(subtotal + cleaningFee + serviceFee + taxes);
  return {
    nights,
    nightly,
    averageNightly: nights > 0 ? round2(subtotal / nights) : 0,
    subtotal,
    cleaningFee,
    serviceFee,
    taxes,
    total,
    currency: 'USD',
  };
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount || 0);
}
