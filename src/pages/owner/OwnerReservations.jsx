import { CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { todayISO } from '@shared/domain/dates.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { EmptyState, ErrorState, Skeleton, Spinner } from '../../components/common/Feedback.jsx';
import { ownerActions } from '../../features/owner/ownerSlice.js';
import { formatCurrency, formatDate, plural, useDocumentTitle } from '../../utils/format.js';

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'];

/** Status actions available to a host, keyed by the current booking status. */
export function hostActionsFor(booking, today = todayISO()) {
  switch (booking.status) {
    case 'pending':
      return [
        { status: 'confirmed', label: 'Approve', cls: 'btn-primary' },
        { status: 'rejected', label: 'Decline', cls: 'btn-secondary text-red-600' },
      ];
    case 'confirmed':
      return [
        ...(booking.checkIn <= today ? [{ status: 'completed', label: 'Mark completed', cls: 'btn-secondary' }] : []),
        { status: 'cancelled', label: 'Cancel', cls: 'btn-secondary text-red-600' },
      ];
    default:
      return [];
  }
}

export default function OwnerReservations() {
  useDocumentTitle('Reservations');
  const dispatch = useDispatch();
  const { reservations, busyIds } = useSelector((s) => s.owner);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(ownerActions.reservationsRequest());
  }, [dispatch]);

  const list = useMemo(() => (filter === 'all' ? reservations.data : reservations.data.filter((b) => b.status === filter)), [reservations.data, filter]);
  const counts = useMemo(() => {
    const c = { all: reservations.data.length };
    reservations.data.forEach((b) => (c[b.status] = (c[b.status] || 0) + 1));
    return c;
  }, [reservations.data]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Reservations</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`btn-sm btn capitalize ${filter === f ? 'bg-brand-600 text-white' : 'btn-secondary'}`}>
            {f} ({counts[f] || 0})
          </button>
        ))}
      </div>

      <div className="mt-6">
        {reservations.status === 'failed' ? (
          <ErrorState message={reservations.error} onRetry={() => dispatch(ownerActions.reservationsRequest())} />
        ) : reservations.status !== 'succeeded' && reservations.data.length === 0 ? (
          <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : list.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No reservations" message="Reservations for your listings will appear here." />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="p-4">Guest</th>
                  <th className="p-4">Property</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {list.map((b) => {
                  const busy = busyIds.includes(b.id);
                  return (
                    <tr key={b.id} data-testid="reservation-row">
                      <td className="p-4">
                        <p className="font-medium">{b.guest?.name}</p>
                        <p className="text-xs text-slate-500">{b.guest?.email}</p>
                      </td>
                      <td className="p-4">{b.property?.title}</td>
                      <td className="p-4 whitespace-nowrap">
                        {formatDate(b.checkIn)} – {formatDate(b.checkOut)}
                        <p className="text-xs text-slate-500">{plural(b.price?.nights || 0, 'night')} · {plural(b.guests, 'guest')}</p>
                        {b.specialRequests && <p className="mt-1 max-w-xs text-xs italic text-slate-500">“{b.specialRequests}”</p>}
                      </td>
                      <td className="p-4 font-semibold">{formatCurrency(b.price?.total)}</td>
                      <td className="p-4"><StatusBadge status={b.status} /></td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {busy && <Spinner className="h-4 w-4" />}
                          {hostActionsFor(b).map((a) => (
                            <button key={a.status} className={`${a.cls} btn-sm`} disabled={busy} onClick={() => dispatch(ownerActions.reservationStatusRequest({ id: b.id, status: a.status }))}>
                              {a.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
