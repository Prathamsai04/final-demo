import { CalendarDays, Luggage, MapPin, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { todayISO } from '@shared/domain/dates.js';
import SafeImage from '../../components/common/SafeImage.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { ConfirmDialog } from '../../components/common/Modal.jsx';
import { EmptyState, ErrorState, Skeleton, Spinner } from '../../components/common/Feedback.jsx';
import { myBookingsActions } from '../../features/myBookings/myBookingsSlice.js';
import { formatCurrency, formatDate, plural, useDocumentTitle } from '../../utils/format.js';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function groupBookings(items, today = todayISO()) {
  const groups = { upcoming: [], past: [], cancelled: [] };
  items.forEach((b) => {
    if (['cancelled', 'rejected'].includes(b.status)) groups.cancelled.push(b);
    else if (b.status === 'completed' || b.checkOut < today) groups.past.push(b);
    else groups.upcoming.push(b);
  });
  groups.upcoming.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  return groups;
}

export default function MyBookingsPage() {
  useDocumentTitle('My trips');
  const dispatch = useDispatch();
  const { items, status, error, cancellingId } = useSelector((s) => s.myBookings);
  const [tab, setTab] = useState('upcoming');
  const [toCancel, setToCancel] = useState(null);

  useEffect(() => {
    dispatch(myBookingsActions.fetchRequest());
  }, [dispatch]);

  useEffect(() => {
    if (toCancel && cancellingId === null && items.find((b) => b.id === toCancel.id)?.status === 'cancelled') setToCancel(null);
  }, [items, cancellingId, toCancel]);

  const groups = useMemo(() => groupBookings(items), [items]);
  const list = groups[tab];

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold">My trips</h1>
      <div className="mt-6 flex gap-2 border-b border-slate-200 dark:border-slate-800" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            {t.label} <span className="ml-1 rounded-full bg-slate-100 px-2 text-xs dark:bg-slate-800">{groups[t.id].length}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {status === 'failed' ? (
          <ErrorState message={error} onRetry={() => dispatch(myBookingsActions.fetchRequest())} />
        ) : status !== 'succeeded' && items.length === 0 ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-36 w-full" />)
        ) : list.length === 0 ? (
          <EmptyState
            icon={Luggage}
            title={tab === 'upcoming' ? 'No upcoming trips' : tab === 'past' ? 'No past trips yet' : 'No cancelled bookings'}
            message={tab === 'upcoming' ? 'Time to dust off your bags and start planning your next adventure.' : undefined}
            action={tab === 'upcoming' && <Link to="/search" className="btn-primary">Start exploring</Link>}
          />
        ) : (
          list.map((b) => (
            <article key={b.id} className="card flex flex-col overflow-hidden sm:flex-row" data-testid="booking-item">
              <SafeImage src={b.property?.image} alt="" className="h-40 w-full sm:h-auto sm:w-52" />
              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link to={`/properties/${b.propertyId}`} className="font-semibold hover:text-brand-600">{b.property?.title}</Link>
                    <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" /> {b.property?.city}, {b.property?.country}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {formatDate(b.checkIn)} – {formatDate(b.checkOut)}</span>
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {plural(b.guests, 'guest')}</span>
                  <span className="font-semibold">{formatCurrency(b.price?.total)}</span>
                </div>
                {b.status === 'cancelled' && b.refundAmount > 0 && <p className="text-xs text-slate-500">Refunded {formatCurrency(b.refundAmount)} (simulated)</p>}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                  <span className="mr-auto font-mono text-xs text-slate-400">#{b.id.toUpperCase()}</span>
                  <Link to={`/bookings/${b.id}/confirmation`} className="btn-ghost btn-sm">Details</Link>
                  {b.cancellation?.eligible && (
                    <button className="btn-secondary btn-sm text-red-600" onClick={() => setToCancel(b)} disabled={cancellingId === b.id}>
                      {cancellingId === b.id && <Spinner className="h-3 w-3" />} Cancel booking
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toCancel)}
        title="Cancel this booking?"
        message={
          toCancel && (
            <div className="space-y-2">
              <p>
                {toCancel.property?.title} · {formatDate(toCancel.checkIn)} – {formatDate(toCancel.checkOut)}
              </p>
              <p className="font-medium">{toCancel.cancellation?.reason}</p>
              <p>
                Refund: <strong>{formatCurrency(toCancel.cancellation?.refundAmount)}</strong> of {formatCurrency(toCancel.price?.total)} (simulated)
              </p>
            </div>
          )
        }
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        danger
        loading={Boolean(cancellingId)}
        onConfirm={() => dispatch(myBookingsActions.cancelRequest(toCancel.id))}
        onCancel={() => setToCancel(null)}
      />
    </div>
  );
}
