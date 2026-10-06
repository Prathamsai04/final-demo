import { CalendarCheck, DollarSign, House, Percent, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RevenueChart, StatCard, StatusBreakdown } from '../../components/common/Stats.jsx';
import { ErrorState, Skeleton } from '../../components/common/Feedback.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { ownerActions } from '../../features/owner/ownerSlice.js';
import { formatCurrency, formatShortDate, useDocumentTitle } from '../../utils/format.js';

export default function OwnerDashboard() {
  useDocumentTitle('Host dashboard');
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { stats, reservations } = useSelector((s) => s.owner);

  useEffect(() => {
    dispatch(ownerActions.statsRequest());
    dispatch(ownerActions.reservationsRequest());
  }, [dispatch]);

  const s = stats.data;
  const pending = reservations.data.filter((b) => b.status === 'pending');
  const upcoming = reservations.data.filter((b) => b.status === 'confirmed').sort((a, b) => a.checkIn.localeCompare(b.checkIn)).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user.name.split(' ')[0]}</h1>
          <p className="text-slate-500">Here&apos;s how your listings are doing.</p>
        </div>
        <Link to="/owner/listings/new" className="btn-primary"><Plus className="h-4 w-4" /> New listing</Link>
      </div>

      {stats.status === 'failed' ? (
        <ErrorState message={stats.error} onRetry={() => dispatch(ownerActions.statsRequest())} />
      ) : !s ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={House} label="Listings" value={s.totals.properties} hint={`${s.totals.activeProperties} active`} />
            <StatCard icon={CalendarCheck} label="Upcoming stays" value={s.totals.upcomingBookings} hint={`${s.bookingsByStatus.pending} pending approval`} tone="blue" />
            <StatCard icon={DollarSign} label="Earnings" value={formatCurrency(s.totals.revenue)} hint="Confirmed + completed" tone="green" />
            <StatCard icon={Percent} label="Occupancy (30d)" value={`${s.totals.occupancyRate}%`} hint="Active listings" tone="violet" />
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="card p-6 xl:col-span-2">
              <h2 className="mb-4 font-semibold">Earnings by check-in month</h2>
              <RevenueChart data={s.revenueByMonth} />
            </div>
            <div className="card p-6">
              <h2 className="mb-4 font-semibold">Reservations by status</h2>
              <StatusBreakdown data={s.bookingsByStatus} />
            </div>
          </div>
        </>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <ReservationList title="Awaiting your approval" items={pending} empty="No pending requests." />
        <ReservationList title="Next arrivals" items={upcoming} empty="No upcoming confirmed stays." />
      </div>
    </div>
  );
}

function ReservationList({ title, items, empty }) {
  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link to="/owner/reservations" className="text-sm font-medium text-brand-600">Manage</Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{b.guest?.name} · {b.property?.title}</p>
                <p className="text-slate-500">{formatShortDate(b.checkIn)} – {formatShortDate(b.checkOut)} · {formatCurrency(b.price?.total)}</p>
              </div>
              <StatusBadge status={b.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
