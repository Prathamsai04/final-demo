// Demo overlay: a compact diff of changes on top of the seed data.
// Shape: { version, users: { [id]: entity | null }, properties: {...}, bookings: {...} }
// `null` marks a deleted entity. Used by the stateless demo API and persisted in browser localStorage.

export const OVERLAY_VERSION = 1;
export const COLLECTIONS = ['users', 'properties', 'bookings'];

export function emptyOverlay() {
  return { version: OVERLAY_VERSION, users: {}, properties: {}, bookings: {} };
}

export function normalizeOverlay(raw) {
  const base = emptyOverlay();
  if (!raw || typeof raw !== 'object' || raw.version !== OVERLAY_VERSION) return base;
  for (const c of COLLECTIONS) {
    if (raw[c] && typeof raw[c] === 'object' && !Array.isArray(raw[c])) base[c] = { ...raw[c] };
  }
  return base;
}

/** Applies overlay changes on top of a list of seed entities. */
export function applyCollection(seedList, changes = {}) {
  const map = new Map(seedList.map((e) => [e.id, e]));
  for (const [id, value] of Object.entries(changes)) {
    if (value === null) map.delete(id);
    else if (value && typeof value === 'object') map.set(id, { ...value, id });
  }
  return [...map.values()];
}

export function applyOverlay(seed, overlay) {
  const o = normalizeOverlay(overlay);
  return Object.fromEntries(COLLECTIONS.map((c) => [c, applyCollection(seed[c] || [], o[c])]));
}

/** Merges a patch (same shape as overlay) into an overlay and returns a new overlay. */
export function mergePatch(overlay, patch) {
  const next = normalizeOverlay(overlay);
  if (!patch) return next;
  for (const c of COLLECTIONS) {
    if (patch[c]) next[c] = { ...next[c], ...patch[c] };
  }
  return next;
}

export function isEmptyPatch(patch) {
  return !patch || COLLECTIONS.every((c) => !patch[c] || Object.keys(patch[c]).length === 0);
}
