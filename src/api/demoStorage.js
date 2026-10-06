import { emptyOverlay, mergePatch, normalizeOverlay } from '@shared/overlay.js';

// Browser persistence for demo mode. The overlay holds only changes relative to the seed data.
export const OVERLAY_KEY = 'homestays.demo.v1';
export const AUTH_KEY = 'homestays.auth';

const safeStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

export function loadOverlay() {
  try {
    const raw = safeStorage()?.getItem(OVERLAY_KEY);
    return raw ? normalizeOverlay(JSON.parse(raw)) : emptyOverlay();
  } catch {
    return emptyOverlay();
  }
}

export function saveOverlay(overlay) {
  try {
    safeStorage()?.setItem(OVERLAY_KEY, JSON.stringify(overlay));
  } catch (e) {
    console.warn('Unable to persist demo data', e);
  }
}

export function applyDemoPatch(patch) {
  const next = mergePatch(loadOverlay(), patch);
  saveOverlay(next);
  return next;
}

export function resetDemoData() {
  safeStorage()?.removeItem(OVERLAY_KEY);
}

export function overlayChangeCount(overlay = loadOverlay()) {
  return ['users', 'properties', 'bookings'].reduce((n, c) => n + Object.keys(overlay[c] || {}).length, 0);
}

export function loadAuth() {
  try {
    const raw = safeStorage()?.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuth(auth) {
  if (auth) safeStorage()?.setItem(AUTH_KEY, JSON.stringify(auth));
  else safeStorage()?.removeItem(AUTH_KEY);
}

/** UTF-8 safe base64 encoding for the X-Demo-State header. */
export function encodeOverlay(overlay) {
  const bytes = new TextEncoder().encode(JSON.stringify(overlay));
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
