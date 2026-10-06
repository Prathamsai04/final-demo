import { ZodError } from 'zod';
import { ApiError, badRequest } from '../errors.js';

/** Validates `req[source]` with a zod schema and replaces it with the parsed value. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(badRequest(details[0]?.message || 'Invalid request.', details));
  }
  if (source === 'query') req.validQuery = result.data;
  else req[source] = result.data;
  next();
};

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found.` } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) err = badRequest(err.issues[0]?.message || 'Invalid request.');
  if (err?.type === 'entity.parse.failed') err = badRequest('Malformed JSON body.');
  if (!(err instanceof ApiError)) {
    console.error('[api] unexpected error', err);
    err = new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
  }
  res.status(err.status).json({ error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } });
}
