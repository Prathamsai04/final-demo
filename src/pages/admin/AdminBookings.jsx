import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { ErrorState, Skeleton, Spinner } from '../../components/common/Feedback.jsx';
import { adminActions } from '../../features/admin/adminSlice.js';
import { formatCurrency, formatDate, useDocumentTitle } from '../../utils/format.js';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];

export default function AdminBookings() {
  useDocumentTitle('Manage bookings');
  const dispatch = useDispatch();
  const { bookings, busyIds } = useSelector((s) => s.admin);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(adminActions.bookingsRequest());
  }, [dispatch]);

  const list = useMemo(() => (filter === 'all' ? bookings.data : bookings.data.filter((b) => b.status === filter)), [bookings.data, filter]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <select className="input w-48" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses ({bookings.data.length})</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s} ({bookings.data.filter((b) => b.status === s).length})</option>
          ))}
        </select>
      </div>
      {bookings.status === 'failed' ? (
        <ErrorState message={bookings.error} onRetry={() => dispatch(adminActions.bookingsRequest())} />
      ) : bookings.status !== 'succeeded' && bookings.data.length === 0 ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <th className="p-4">Booking</th>
                <th className="p-4">Guest</th>
                <th className="p-4">Property</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.map((b) => {
                const busy = busyIds.includes(b.id);
                return (
                  <tr key={b.id}>
                    <td className="p-4 font-mono text-xs">{b.id.toUpperCase()}</td>
                    <td className="p-4">{b.guest?.name}</td>
                    <td className="p-4">{b.property?.title}</td>
                    <td className="p-4 whitespace-nowrap">{formatDate(b.checkIn)} – {formatDate(b.checkOut)}</td>
                    <td className="p-4 font-semibold">{formatCurrency(b.price?.total)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={b.status} />
                        <select
                          className="input w-32 py-1.5"
                          value={b.status}
                          disabled={busy}
                          onChange={(e) => dispatch(adminActions.bookingUpdateRequest({ id: b.id, status: e.target.value }))}
                          aria-label={`Change status of ${b.id}`}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {busy && <Spinner className="h-4 w-4" />}
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
  );
}
