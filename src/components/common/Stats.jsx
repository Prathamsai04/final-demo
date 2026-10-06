import { formatCurrency, formatMonth } from '../../utils/format.js';

export function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30',
    blue: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        {Icon && (
          <span className={`rounded-xl p-2 ${tones[tone]}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function RevenueChart({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <div className="flex h-56 gap-2" role="img" aria-label="Revenue by month">
      {data.map((d) => (
        <div key={d.month} className="group flex flex-1 flex-col items-center gap-2">
          <div className="relative w-full flex-1">
            <div
              className="absolute inset-x-0 bottom-0 rounded-t-lg bg-brand-500/80 transition group-hover:bg-brand-600"
              style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }}
              title={`${formatMonth(d.month)}: ${formatCurrency(d.revenue)} (${d.bookings} bookings)`}
            />
          </div>
          <span className="text-[10px] text-slate-500">{formatMonth(d.month)}</span>
        </div>
      ))}
    </div>
  );
}

const STATUS_COLORS = { confirmed: 'bg-emerald-500', pending: 'bg-amber-400', completed: 'bg-sky-500', cancelled: 'bg-slate-400', rejected: 'bg-red-500' };

export function StatusBreakdown({ data = {} }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className={STATUS_COLORS[k]} style={{ width: `${(v / total) * 100}%` }} />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-2 text-sm">
        {Object.entries(data).map(([k, v]) => (
          <li key={k} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[k]}`} />
            <span className="capitalize text-slate-600 dark:text-slate-300">{k}</span>
            <span className="ml-auto font-semibold">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
