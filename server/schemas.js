import { z } from 'zod';
import { AMENITY_IDS, PROPERTY_TYPES } from '../shared/constants.js';
import { BOOKING_STATUSES } from '../shared/domain/availability.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates must be in YYYY-MM-DD format.');
const csv = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => (Array.isArray(v) ? v : v ? v.split(',') : []).map((s) => s.trim()).filter(Boolean));
const optNum = z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().finite().optional());

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100),
  role: z.enum(['guest', 'owner']).default('guest'),
});

export const searchSchema = z.object({
  destination: z.string().max(100).optional(),
  checkIn: isoDate.optional().or(z.literal('').transform(() => undefined)),
  checkOut: isoDate.optional().or(z.literal('').transform(() => undefined)),
  guests: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().int().min(1).max(30).optional()),
  minPrice: optNum,
  maxPrice: optNum,
  type: z.string().optional(),
  amenities: csv,
  sort: z.enum(['recommended', 'price_asc', 'price_desc', 'rating', 'newest']).default('recommended'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const quoteSchema = z.object({
  checkIn: isoDate,
  checkOut: isoDate,
  guests: z.coerce.number().int().min(1).default(1),
});

export const bookingSchema = z.object({
  propertyId: z.string().min(1),
  checkIn: isoDate,
  checkOut: isoDate,
  guests: z.coerce.number().int().min(1, 'At least one guest is required.'),
  specialRequests: z.string().max(500).optional(),
  payment: z.object({
    cardName: z.string().trim().min(2, 'Enter the name on the card.'),
    cardNumber: z
      .string()
      .transform((s) => s.replace(/\s+/g, ''))
      .refine((s) => /^\d{16}$/.test(s), 'Card number must be 16 digits.'),
    expiry: z
      .string()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry must be MM/YY.')
      .refine((s) => {
        const [m, y] = s.split('/').map(Number);
        const now = new Date();
        const exp = new Date(Date.UTC(2000 + y, m, 1));
        return exp > now;
      }, 'Card has expired.'),
    cvc: z.string().regex(/^\d{3,4}$/, 'CVC must be 3 or 4 digits.'),
  }),
});

const blockedRange = z
  .object({ start: isoDate, end: isoDate, note: z.string().max(100).optional() })
  .refine((r) => r.end > r.start, 'Blocked range end must be after start.');

export const propertySchema = z
  .object({
    title: z.string().trim().min(5, 'Title must be at least 5 characters.').max(100),
    type: z.enum(PROPERTY_TYPES),
    description: z.string().trim().min(20, 'Description must be at least 20 characters.').max(3000),
    city: z.string().trim().min(2, 'City is required.').max(80),
    country: z.string().trim().min(2, 'Country is required.').max(80),
    address: z.string().trim().min(3, 'Address is required.').max(200),
    pricePerNight: z.coerce.number().min(10, 'Nightly price must be at least $10.').max(10000),
    weekendPrice: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().min(10).max(10000).nullable()).optional(),
    cleaningFee: z.coerce.number().min(0).max(2000).default(0),
    maxGuests: z.coerce.number().int().min(1).max(30),
    bedrooms: z.coerce.number().int().min(0).max(30),
    beds: z.coerce.number().int().min(1).max(40),
    bathrooms: z.coerce.number().min(0).max(30),
    amenities: z.array(z.enum(AMENITY_IDS)).default([]),
    images: z.array(z.string().url('Each image must be a valid URL.')).min(1, 'Add at least one image URL.').max(12),
    instantBook: z.boolean().default(true),
    status: z.enum(['active', 'inactive']).default('active'),
    blockedDates: z.array(blockedRange).max(50).optional(),
  });

export const propertyUpdateSchema = propertySchema.partial();

export const availabilitySchema = z.object({ blockedDates: z.array(blockedRange).max(50) });

export const statusSchema = z.object({ status: z.enum(BOOKING_STATUSES) });

export const adminUserUpdateSchema = z
  .object({ role: z.enum(['guest', 'owner', 'admin']).optional(), status: z.enum(['active', 'suspended']).optional(), name: z.string().min(2).max(80).optional() })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update.');

export const adminPropertyUpdateSchema = z.object({ status: z.enum(['active', 'inactive', 'suspended']) });
