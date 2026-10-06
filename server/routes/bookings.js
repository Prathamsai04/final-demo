import { Router } from 'express';
import { forbidden, notFound } from '../errors.js';
import { requireAuth } from '../middleware/auth.js';
import { send } from '../middleware/demoState.js';
import { validate } from '../middleware/errors.js';
import { bookingSchema } from '../schemas.js';
import { cancelBookingAsGuest, createBooking, presentBookings, sortBookings } from '../services/bookingService.js';

const router = Router();
router.use(requireAuth);

router.post('/', validate(bookingSchema), async (req, res) => {
  const booking = await createBooking(req.repo, req.user, req.body);
  const [presented] = await presentBookings(req.repo, [booking]);
  send(req, res, presented, 201);
});

router.get('/me', async (req, res) => {
  const mine = (await req.repo.listBookings()).filter((b) => b.guestId === req.user.id);
  send(req, res, await presentBookings(req.repo, sortBookings(mine)));
});

async function loadAccessibleBooking(req) {
  const booking = await req.repo.getBooking(req.params.id);
  if (!booking) throw notFound('Booking not found.');
  const u = req.user;
  if (u.role !== 'admin' && booking.guestId !== u.id && booking.ownerId !== u.id) throw forbidden('You cannot view this booking.');
  return booking;
}

router.get('/:id', async (req, res) => {
  const booking = await loadAccessibleBooking(req);
  const [presented] = await presentBookings(req.repo, [booking]);
  send(req, res, presented);
});

router.post('/:id/cancel', async (req, res) => {
  const booking = await loadAccessibleBooking(req);
  const updated = await cancelBookingAsGuest(req.repo, req.user, booking);
  const [presented] = await presentBookings(req.repo, [updated]);
  send(req, res, presented);
});

export default router;
