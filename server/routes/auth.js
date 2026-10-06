import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { conflict, forbidden, unauthorized } from '../errors.js';
import { requireAuth, sanitizeUser, signToken } from '../middleware/auth.js';
import { send } from '../middleware/demoState.js';
import { validate } from '../middleware/errors.js';
import { loginSchema, registerSchema } from '../schemas.js';
import { newId, nowISO } from '../utils.js';

const router = Router();

router.post('/login', validate(loginSchema), async (req, res) => {
  const user = await req.repo.getUserByEmail(req.body.email);
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw unauthorized('Invalid email or password.');
  if (user.status === 'suspended') throw forbidden('This account has been suspended. Contact support.');
  send(req, res, { token: signToken(user), user: sanitizeUser(user) });
});

router.post('/register', validate(registerSchema), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (await req.repo.getUserByEmail(email)) throw conflict('An account with this email already exists.');
  const user = await req.repo.createUser({
    id: newId('u'),
    name,
    email: email.toLowerCase(),
    role,
    status: 'active',
    avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
    createdAt: nowISO(),
    passwordHash: await bcrypt.hash(password, 8),
  });
  send(req, res, { token: signToken(user), user: sanitizeUser(user) }, 201);
});

router.get('/me', requireAuth, (req, res) => send(req, res, { user: sanitizeUser(req.user) }));

export default router;
