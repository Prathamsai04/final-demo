import { normalizeOverlay, isEmptyPatch } from '../../shared/overlay.js';
import { createRepository } from '../repositories/index.js';

export const DEMO_STATE_HEADER = 'x-demo-state';
const MAX_OVERLAY_BYTES = 2_000_000;

function decodeHeader(value) {
  try {
    const json = Buffer.from(String(value), 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Supports `X-HTTP-Method-Override: GET` on POST requests so the client can send a large
 * demo overlay in the request body instead of a header.
 */
export function methodOverride(req, _res, next) {
  const override = req.get('x-http-method-override');
  if (req.method === 'POST' && override && override.toUpperCase() === 'GET') req.method = 'GET';
  next();
}

/** Attaches a per-request repository (`req.repo`). In demo mode it is built from the client overlay. */
export function attachRepository(req, _res, next) {
  let overlay = null;
  if (req.body && typeof req.body === 'object' && req.body.__demoState) {
    overlay = req.body.__demoState;
    delete req.body.__demoState;
  } else if (req.get(DEMO_STATE_HEADER)) {
    const header = req.get(DEMO_STATE_HEADER);
    if (header.length < MAX_OVERLAY_BYTES) overlay = decodeHeader(header);
  }
  req.repo = createRepository({ overlay: normalizeOverlay(overlay) });
  next();
}

/** Sends `{ data, demoPatch? }`. `demoPatch` contains demo-mode changes for the client to persist. */
export function send(req, res, data, status = 200) {
  const patch = req.repo?.getPatch?.();
  const body = { data };
  if (patch && !isEmptyPatch(patch)) body.demoPatch = patch;
  return res.status(status).json(body);
}
