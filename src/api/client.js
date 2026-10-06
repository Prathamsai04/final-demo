import { applyDemoPatch, encodeOverlay, loadAuth, loadOverlay, overlayChangeCount } from './demoStorage.js';

// Keep the header comfortably below common proxy limits; larger overlays go in the request body.
const MAX_HEADER_OVERLAY = 6000;

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR', details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const buildQuery = (query) => {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    params.set(k, Array.isArray(v) ? v.join(',') : String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
};

/**
 * Fetch wrapper for the REST API. In demo mode it sends the browser's demo overlay with
 * each request and persists any `demoPatch` returned by the server.
 */
export async function request(method, path, { body, query, signal } = {}) {
  const headers = { Accept: 'application/json' };
  const token = loadAuth()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;

  let httpMethod = method;
  let payload = body;
  const overlay = loadOverlay();
  if (overlayChangeCount(overlay) > 0) {
    const encoded = encodeOverlay(overlay);
    if (encoded.length <= MAX_HEADER_OVERLAY) {
      headers['X-Demo-State'] = encoded;
    } else {
      if (method === 'GET') {
        httpMethod = 'POST';
        headers['X-HTTP-Method-Override'] = 'GET';
      }
      payload = { ...(body || {}), __demoState: overlay };
    }
  }
  if (payload !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`/api${path}${buildQuery(query)}`, {
      method: httpMethod,
      headers,
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
      signal,
    });
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection and try again.');
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON response
  }
  if (!res.ok) {
    const err = json?.error;
    throw new ApiError(err?.message || `Request failed (${res.status}).`, { status: res.status, code: err?.code, details: err?.details });
  }
  if (json?.demoPatch) applyDemoPatch(json.demoPatch);
  return json?.data;
}

export const http = {
  get: (path, query, opts) => request('GET', path, { ...opts, query }),
  post: (path, body) => request('POST', path, { body: body ?? {} }),
  put: (path, body) => request('PUT', path, { body: body ?? {} }),
  patch: (path, body) => request('PATCH', path, { body: body ?? {} }),
  del: (path) => request('DELETE', path),
};
