import { randomBytes } from 'node:crypto';

export const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${randomBytes(3).toString('hex')}`;

export const nowISO = () => new Date().toISOString();

export function paginate(items, page = 1, pageSize = 12) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return { items: items.slice((current - 1) * pageSize, current * pageSize), page: current, pageSize, total, totalPages };
}
