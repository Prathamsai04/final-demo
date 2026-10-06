import { formatCurrency } from '@shared/domain/pricing.js';
import { formatDisplayDate } from '@shared/domain/dates.js';
import { useEffect } from 'react';

export { formatCurrency };
export const formatDate = (iso) => formatDisplayDate(iso);
export const formatShortDate = (iso) => formatDisplayDate(iso, { month: 'short', day: 'numeric' });
export const formatDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '');
export const formatMonth = (ym) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · HomeStays` : 'HomeStays — Book unique homestays';
  }, [title]);
}

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
