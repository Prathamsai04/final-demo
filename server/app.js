import express from 'express';
import { attachRepository, methodOverride, send } from './middleware/demoState.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { getDataMode } from './repositories/index.js';
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import bookingRoutes from './routes/bookings.js';
import ownerRoutes from './routes/owner.js';
import adminRoutes from './routes/admin.js';
import { AMENITIES, PROPERTY_TYPES } from '../shared/constants.js';
import { DEMO_ACCOUNTS } from '../shared/seed/index.js';

export function createApiRouter() {
  const api = express.Router();
  api.use(express.json({ limit: '4mb' }));
  api.use(methodOverride);
  api.use(attachRepository);
  api.use(authenticate);

  api.get('/health', (req, res) => send(req, res, { status: 'ok', mode: getDataMode(), time: new Date().toISOString() }));
  api.get('/meta', (req, res) =>
    send(req, res, {
      mode: getDataMode(),
      amenities: AMENITIES,
      propertyTypes: PROPERTY_TYPES,
      demoAccounts: getDataMode() === 'demo' ? DEMO_ACCOUNTS : [],
    }),
  );
  api.use('/auth', authRoutes);
  api.use('/properties', propertyRoutes);
  api.use('/bookings', bookingRoutes);
  api.use('/owner', ownerRoutes);
  api.use('/admin', adminRoutes);
  api.use(notFoundHandler);
  api.use(errorHandler);
  return api;
}

/**
 * Creates the Express app. `mountAtRoot` also mounts the API at "/" for platforms that
 * strip the "/api" prefix before invoking the function.
 */
export function createApp({ mountAtRoot = false } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);
  const api = createApiRouter();
  app.use('/api', api);
  if (mountAtRoot) app.use('/', api);
  return app;
}
