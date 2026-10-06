import { Router } from 'express';
import { BLOCKING_STATUSES } from '../../shared/domain/availability.js';
import { todayISO } from '../../shared/domain/dates.js';
import { badRequest, forbidden, notFound } from '../errors.js';
import { requireRole } from '../middleware/auth.js';
import { send } from '../middleware/demoState.js';
import { validate } from '../middleware/errors.js';
import { availabilitySchema, propertySchema, propertyUpdateSchema, statusSchema } from '../schemas.js';
import { changeBookingStatus, presentBookings, sortBookings } from '../services/bookingService.js';
import { presentProperty } from '../services/propertyService.js';
import { computeStats } from '../services/statsService.js';
import { newId, nowISO } from '../utils.js';

const router = Router();
router.use(requireRole('owner', 'admin'));

async function loadOwnProperty(req) {
  const property = await req.repo.getProperty(req.params.id);
  if (!property) throw notFound('Property not found.');
  if (req.user.role !== 'admin' && property.ownerId !== req.user.id) throw forbidden('You can only manage your own listings.');
  return property;
}

const ownBookings = async (req) => (await req.repo.listBookings()).filter((b) => b.ownerId === req.user.id);

router.get('/stats', async (req, res) => {
  const properties = (await req.repo.listProperties()).filter((p) => p.ownerId === req.user.id);
  const bookings = await ownBookings(req);
  send(req, res, computeStats({ properties, bookings }));
});

router.get('/properties', async (req, res) => {
  const [all, bookings] = await Promise.all([req.repo.listProperties(), req.repo.listBookings()]);
  const mine = all.filter((p) => p.ownerId === req.user.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  send(req, res, mine.map((p) => presentProperty(p, { bookings })));
});

router.get('/properties/:id', async (req, res) => {
  send(req, res, await loadOwnProperty(req));
});

router.post('/properties', validate(propertySchema), async (req, res) => {
  const now = nowISO();
  const property = await req.repo.createProperty({
    weekendPrice: null,
    blockedDates: [],
    ...req.body,
    id: newId('p'),
    ownerId: req.user.id,
    rating: 0,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  send(req, res, property, 201);
});

router.put('/properties/:id', validate(propertyUpdateSchema), async (req, res) => {
  await loadOwnProperty(req);
  send(req, res, await req.repo.updateProperty(req.params.id, req.body));
});

router.delete('/properties/:id', async (req, res) => {
  const property = await loadOwnProperty(req);
  const today = todayISO();
  const upcoming = (await req.repo.listBookings()).filter(
    (b) => b.propertyId === property.id && BLOCKING_STATUSES.includes(b.status) && b.checkOut > today,
  );
  if (upcoming.length) throw badRequest(`This listing has ${upcoming.length} upcoming booking(s). Deactivate it instead, or cancel the bookings first.`);
  await req.repo.deleteProperty(property.id);
  send(req, res, { id: property.id, deleted: true });
});

router.put('/properties/:id/availability', validate(availabilitySchema), async (req, res) => {
  await loadOwnProperty(req);
  send(req, res, await req.repo.updateProperty(req.params.id, { blockedDates: req.body.blockedDates }));
});

router.get('/reservations', async (req, res) => {
  let list = await ownBookings(req);
  if (req.query.status) list = list.filter((b) => b.status === req.query.status);
  if (req.query.propertyId) list = list.filter((b) => b.propertyId === req.query.propertyId);
  send(req, res, await presentBookings(req.repo, sortBookings(list)));
});

router.patch('/reservations/:id/status', validate(statusSchema), async (req, res) => {
  const booking = await req.repo.getBooking(req.params.id);
  if (!booking) throw notFound('Reservation not found.');
  if (req.user.role !== 'admin' && booking.ownerId !== req.user.id) throw forbidden('You can only manage reservations for your listings.');
  const updated = await changeBookingStatus(req.repo, req.user, booking, req.body.status);
  const [presented] = await presentBookings(req.repo, [updated]);
  send(req, res, presented);
});

export default router;
