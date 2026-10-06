import { formatCurrency, formatShortDate, plural } from '../../utils/format.js';

export default function PriceBreakdown({ price, showNightly = false }) {
  if (!price) return null;
  const weekendNights = price.nightly?.filter((n) => n.weekend).length || 0;
  return (
    <dl className="space-y-2 text-sm" data-testid="price-breakdown">
      <Row label={`${formatCurrency(price.averageNightly)} × ${plural(price.nights, 'night')}`} value={price.subtotal} />
      {weekendNights > 0 && <p className="-mt-1 text-xs text-slate-500">Includes {plural(weekendNights, 'weekend night')} at weekend rate</p>}
      {showNightly && (
        <ul className="max-h-32 space-y-0.5 overflow-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-500 dark:bg-slate-800">
          {price.nightly.map((n) => (
            <li key={n.date} className="flex justify-between">
              <span>{formatShortDate(n.date)}{n.weekend ? ' (weekend)' : ''}</span>
              <span>{formatCurrency(n.price)}</span>
            </li>
          ))}
        </ul>
      )}
      {price.cleaningFee > 0 && <Row label="Cleaning fee" value={price.cleaningFee} />}
      <Row label="Service fee (10%)" value={price.serviceFee} />
      <Row label="Taxes (12%)" value={price.taxes} />
      <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold dark:border-slate-700">
        <dt>Total (USD)</dt>
        <dd data-testid="price-total">{formatCurrency(price.total)}</dd>
      </div>
    </dl>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-slate-600 dark:text-slate-300">
      <dt>{label}</dt>
      <dd>{formatCurrency(value)}</dd>
    </div>
  );
}
