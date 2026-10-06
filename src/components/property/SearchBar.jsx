import { CalendarDays, MapPin, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { addDays, todayISO } from '@shared/domain/dates.js';

/** Destination / dates / guests search form. Validates the date range before submitting. */
export default function SearchBar({ initial = {}, destinations = [], onSubmit, compact = false }) {
  const [values, setValues] = useState({ destination: '', checkIn: '', checkOut: '', guests: 1, ...initial });
  const [error, setError] = useState(null);
  const today = todayISO();

  useEffect(() => {
    setValues((v) => ({ ...v, ...initial }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.destination, initial.checkIn, initial.checkOut, initial.guests]);

  const set = (k) => (e) => {
    const value = e.target.value;
    setError(null);
    setValues((v) => {
      const next = { ...v, [k]: value };
      if (k === 'checkIn' && value && (!v.checkOut || v.checkOut <= value)) next.checkOut = addDays(value, 1);
      return next;
    });
  };

  const submit = (e) => {
    e.preventDefault();
    if ((values.checkIn && !values.checkOut) || (!values.checkIn && values.checkOut)) return setError('Select both check-in and check-out dates.');
    if (values.checkIn && values.checkIn < today) return setError('Check-in cannot be in the past.');
    if (values.checkIn && values.checkOut <= values.checkIn) return setError('Check-out must be after check-in.');
    onSubmit({ ...values, guests: Number(values.guests) || 1 });
  };

  const box = compact ? 'p-2' : 'p-3';
  return (
    <form onSubmit={submit} className="card w-full p-2 shadow-lg" role="search">
      <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_1fr_0.7fr_auto]">
        <label className={`flex flex-col rounded-xl ${box} hover:bg-slate-50 dark:hover:bg-slate-800`}>
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500"><MapPin className="h-3.5 w-3.5" /> Where</span>
          <input
            list="destinations"
            className="bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Search destinations"
            value={values.destination}
            onChange={set('destination')}
            aria-label="Destination"
          />
          <datalist id="destinations">
            {destinations.map((d) => (
              <option key={d} value={d.split(',')[0]} />
            ))}
          </datalist>
        </label>
        <label className={`flex flex-col rounded-xl ${box} hover:bg-slate-50 dark:hover:bg-slate-800`}>
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500"><CalendarDays className="h-3.5 w-3.5" /> Check in</span>
          <input type="date" min={today} className="bg-transparent text-sm outline-none" value={values.checkIn} onChange={set('checkIn')} aria-label="Check-in date" />
        </label>
        <label className={`flex flex-col rounded-xl ${box} hover:bg-slate-50 dark:hover:bg-slate-800`}>
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500"><CalendarDays className="h-3.5 w-3.5" /> Check out</span>
          <input
            type="date"
            min={values.checkIn ? addDays(values.checkIn, 1) : addDays(today, 1)}
            className="bg-transparent text-sm outline-none"
            value={values.checkOut}
            onChange={set('checkOut')}
            aria-label="Check-out date"
          />
        </label>
        <label className={`flex flex-col rounded-xl ${box} hover:bg-slate-50 dark:hover:bg-slate-800`}>
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500"><Users className="h-3.5 w-3.5" /> Guests</span>
          <input type="number" min={1} max={30} className="bg-transparent text-sm outline-none" value={values.guests} onChange={set('guests')} aria-label="Guests" />
        </label>
        <button type="submit" className="btn-primary h-full min-h-[3rem] rounded-xl px-6">
          <Search className="h-4 w-4" /> Search
        </button>
      </div>
      {error && <p className="field-error px-3 pb-1" role="alert">{error}</p>}
    </form>
  );
}
