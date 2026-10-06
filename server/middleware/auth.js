import jwt from 'jsonwebtoken';
import { forbidden, unauthorized } from '../errors.js';

const DEMO_JWT_SECRET = 'homestays-demo-secret-not-for-production';

export const jwtSecret = () => process.env.JWT_SECRET || DEMO_JWT_SECRET;

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, name: user.name }, jwtSecret(), { expiresIn: '7d' });
}

export function sanitizeUser(user) {
  if (!user) return null;
  // eslint-disable-next-line no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

/** Resolves `req.user` from a Bearer token when present. Invalid tokens are rejected. */
export async function authenticate(req, _res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next();
  let payload;
  try {
    payload = jwt.verify(token, jwtSecret());
  } catch {
    return next(unauthorized('Your session has expired. Please sign in again.'));
  }
  const user = await req.repo.getUserById(payload.sub);
  if (!user) return next(unauthorized('Account not found. Please sign in again.'));
  if (user.status === 'suspended') return next(forbidden('This account has been suspended.'));
  req.user = user;
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized());
  next();
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (!roles.includes(req.user.role)) return next(forbidden());
  next();
};
