import { Router } from 'express';
import { notFound } from '../errors.js';
import { send } from '../middleware/demoState.js';
import { validate } from '../middleware/errors.js';
import { quoteSchema, searchSchema } from '../schemas.js';
import { getAvailability, presentProperty, searchProperties } from '../services/propertyService.js';
import { quoteStay } from '../services/bookingService.js';

const router = Router();

async function loadVisibleProperty(req) {
  const property = await req.repo.getProperty(req.params.id);
  const canSeeHidden = req.user && (req.user.role === 'admin' || req.user.id === property?.ownerId);
  if (!property || (property.status !== 'active' && !canSeeHidden)) throw notFound('Property not found.');
  return property;
}

router.get('/', validate(searchSchema, 'query'), async (req, res) => {
  send(req, res, await searchProperties(req.repo, req.validQuery));
});

router.get('/:id', async (req, res) => {
  const property = await loadVisibleProperty(req);
  const users = await req.repo.listUsers();
  send(req, res, presentProperty(property, { usersById: new Map(users.map((u) => [u.id, u])) }));
});

router.get('/:id/availability', async (req, res) => {
  const property = await loadVisibleProperty(req);
  send(req, res, await getAvailability(req.repo, property));
});

router.post('/:id/quote', validate(quoteSchema), async (req, res) => {
  const property = await loadVisibleProperty(req);
  send(req, res, await quoteStay(req.repo, property, req.body));
});

export default router;
