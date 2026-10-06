import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { addDays, eachNight, todayISO } from '@shared/domain/dates.js';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function monthDays(year, month) {
  const first = new Date(Date.UTC(year, month, 1));
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = Array(first.getUTCDay()).fill(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(Date.UTC(year, month, d)).toISOString().slice(0, 10));
  return cells;
}

/**
 * Two-month availability calendar. Unavailable nights are struck through. When `onSelect`
 * is provided, clicking selects a check-in and then a check-out date.
 */
export default function AvailabilityCalendar({ unavailable = [], checkIn, checkOut, onSelect, months = 2 }) {
  const today = todayISO();
  const [offset, setOffset] = useState(0);
  const blocked = useMemo(() => new Set(unavailable), [unavailable]);
  const base = new Date(`${today}T00:00:00Z`);

  const click = (iso) => {
    if (!onSelect || iso < today) return;
    if (!checkIn || checkOut || iso <= checkIn) {
      if (blocked.has(iso)) return;
      onSelect({ checkIn: iso, checkOut: '' });
      return;
    }
    const nights = eachNight(checkIn, iso);
    if (nights.some((n) => blocked.has(n))) {
      if (!blocked.has(iso)) onSelect({ checkIn: iso, checkOut: '' });
      return;
    }
    onSelect({ checkIn, checkOut: iso });
  };

  const inRange = (iso) => checkIn && checkOut && iso >= checkIn && iso < checkOut;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button className="btn-ghost p-2" onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0} aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-brand-600" /> Selected</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-200 dark:bg-slate-700" /> Unavailable</span>
        </div>
        <button className="btn-ghost p-2" onClick={() => setOffset((o) => Math.min(11, o + 1))} aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className={`grid gap-6 ${months > 1 ? 'md:grid-cols-2' : ''}`}>
        {Array.from({ length: months }, (_, i) => {
          const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset + i, 1));
          const cells = monthDays(d.getUTCFullYear(), d.getUTCMonth());
          return (
            <div key={i} className={i > 0 ? 'hidden md:block' : ''}>
              <p className="mb-2 text-center text-sm font-semibold">
                {d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
              </p>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {WEEKDAYS.map((w) => (
                  <span key={w} className="py-1 font-medium text-slate-400">{w}</span>
                ))}
                {cells.map((iso, idx) => {
                  if (!iso) return <span key={`e${idx}`} />;
                  const past = iso < today;
                  const isBlocked = blocked.has(iso);
                  const selected = iso === checkIn || iso === checkOut;
                  const cls = selected
                    ? 'bg-brand-600 text-white font-semibold'
                    : inRange(iso)
                      ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
                      : isBlocked
                        ? 'bg-slate-200 text-slate-400 line-through dark:bg-slate-800'
                        : past
                          ? 'text-slate-300 dark:text-slate-600'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800';
                  return (
                    <button
                      type="button"
                      key={iso}
                      onClick={() => click(iso)}
                      disabled={past || !onSelect}
                      className={`aspect-square rounded-lg text-xs transition disabled:cursor-default ${cls}`}
                      aria-label={`${iso}${isBlocked ? ' unavailable' : ''}`}
                    >
                      {Number(iso.slice(8))}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {onSelect && checkIn && !checkOut && <p className="mt-2 text-xs text-slate-500">Now select your check-out date (on or after {addDays(checkIn, 1)}).</p>}
    </div>
  );
}
