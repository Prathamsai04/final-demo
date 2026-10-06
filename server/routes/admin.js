import { Router } from 'express';
import { BLOCKING_STATUSES } from '../../shared/domain/availability.js';
import { todayISO } from '../../shared/domain/dates.js';
import { badRequest, notFound } from '../errors.js';
import { requireRole, sanitizeUser } from '../middleware/auth.js';
import { send } from '../middleware/demoState.js';
import { validate } from '../middleware/errors.js';
import { adminPropertyUpdateSchema, adminUserUpdateSchema, statusSchema } from '../schemas.js';
import { changeBookingStatus, presentBookings, sortBookings } from '../services/bookingService.js';
import { presentProperty } from '../services/propertyService.js';
import { computeStats } from '../services/statsService.js';

const router = Router();
router.use(requireRole('admin'));

router.get('/stats', async (req, res) => {
  const [properties, bookings, users] = await Promise.all([req.repo.listProperties(), req.repo.listBookings(), req.repo.listUsers()]);
  send(req, res, computeStats({ properties, bookings, users }));
});

// Users
router.get('/users', async (req, res) => {
  const [users, properties, bookings] = await Promise.all([req.repo.listUsers(), req.repo.listProperties(), req.repo.listBookings()]);
  const list = users
    .map((u) => ({
      ...sanitizeUser(u),
      propertyCount: properties.filter((p) => p.ownerId === u.id).length,
      bookingCount: bookings.filter((b) => b.guestId === u.id).length,
    }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  send(req, res, list);
});

router.patch('/users/:id', validate(adminUserUpdateSchema), async (req, res) => {
  if (req.params.id === req.user.id && (req.body.role && req.body.role !== 'admin' || req.body.status === 'suspended')) {
    throw badRequest('You cannot demote or suspend your own admin account.');
  }
  const updated = await req.repo.updateUser(req.params.id, req.body);
  if (!updated) throw notFound('User not found.');
  send(req, res, sanitizeUser(updated));
});

router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) throw badRequest('You cannot delete your own account.');
  const user = await req.repo.getUserById(req.params.id);
  if (!user) throw notFound('User not found.');
  const today = todayISO();
  const bookings = await req.repo.listBookings();
  const active = bookings.filter((b) => (b.guestId === user.id || b.ownerId === user.id) && BLOCKING_STATUSES.includes(b.status) && b.checkOut > today);
  if (active.length) throw badRequest(`User has ${active.length} active booking(s). Suspend the account instead.`);
  await req.repo.deleteUser(user.id);
  send(req, res, { id: user.id, deleted: true });
});

// Properties
router.get('/properties', async (req, res) => {
  const [properties, bookings, users] = await Promise.all([req.repo.listProperties(), req.repo.listBookings(), req.repo.listUsers()]);
  const usersById = new Map(users.map((u) => [u.id, u]));
  send(req, res, properties.map((p) => presentProperty(p, { usersById, bookings })).sort((a, b) => a.title.localeCompare(b.title)));
});

router.patch('/properties/:id', validate(adminPropertyUpdateSchema), async (req, res) => {
  const updated = await req.repo.updateProperty(req.params.id, req.body);
  if (!updated) throw notFound('Property not found.');
  send(req, res, updated);
});

router.delete('/properties/:id', async (req, res) => {
  const property = await req.repo.getProperty(req.params.id);
  if (!property) throw notFound('Property not found.');
  const today = todayISO();
  const upcoming = (await req.repo.listBookings()).filter((b) => b.propertyId === property.id && BLOCKING_STATUSES.includes(b.status) && b.checkOut > today);
  if (upcoming.length) throw badRequest(`Property has ${upcoming.length} upcoming booking(s). Suspend it instead.`);
  await req.repo.deleteProperty(property.id);
  send(req, res, { id: property.id, deleted: true });
});

// Bookings
router.get('/bookings', async (req, res) => {
  let list = await req.repo.listBookings();
  if (req.query.status) list = list.filter((b) => b.status === req.query.status);
  send(req, res, await presentBookings(req.repo, sortBookings(list)));
});

router.patch('/bookings/:id', validate(statusSchema), async (req, res) => {
  const booking = await req.repo.getBooking(req.params.id);
  if (!booking) throw notFound('Booking not found.');
  const updated = await changeBookingStatus(req.repo, req.user, booking, req.body.status);
  const [presented] = await presentBookings(req.repo, [updated]);
  send(req, res, presented);
});

export default router;
