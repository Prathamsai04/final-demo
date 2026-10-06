/** Builds URL search params from filter values, omitting empty values and defaults. */
export function toSearchParams(values) {
  const p = new URLSearchParams();
  Object.entries(values).forEach(([k, v]) => {
    if (v === '' || v == null || (Array.isArray(v) && v.length === 0)) return;
    if (k === 'guests' && Number(v) === 1) return;
    if (k === 'page' && Number(v) === 1) return;
    if (k === 'sort' && v === 'recommended') return;
    p.set(k, Array.isArray(v) ? v.join(',') : String(v));
  });
  return p;
}
