import { CalendarCheck, DollarSign, House, Percent, Users } from 'lucide-react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RevenueChart, StatCard, StatusBreakdown } from '../../components/common/Stats.jsx';
import { ErrorState, Skeleton } from '../../components/common/Feedback.jsx';
import { adminActions } from '../../features/admin/adminSlice.js';
import { formatCurrency, useDocumentTitle } from '../../utils/format.js';

export default function AdminDashboard() {
  useDocumentTitle('Admin');
  const dispatch = useDispatch();
  const { stats } = useSelector((s) => s.admin);

  useEffect(() => {
    dispatch(adminActions.statsRequest());
  }, [dispatch]);

  const s = stats.data;
  if (stats.status === 'failed') return <ErrorState message={stats.error} onRetry={() => dispatch(adminActions.statsRequest())} />;
  if (!s) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Platform overview</h1>
        <p className="text-slate-500">Bookings, properties and users across HomeStays.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="admin-stats">
        <StatCard icon={DollarSign} label="Gross booking value" value={formatCurrency(s.totals.revenue)} hint={`Avg ${formatCurrency(s.totals.averageBookingValue)} / booking`} tone="green" />
        <StatCard icon={CalendarCheck} label="Total bookings" value={s.totals.bookings} hint={`${s.totals.upcomingBookings} upcoming`} tone="blue" />
        <StatCard icon={House} label="Properties" value={s.totals.properties} hint={`${s.totals.activeProperties} active`} />
        <StatCard icon={Users} label="Users" value={s.totals.users} hint={`${s.totals.guests} guests · ${s.totals.owners} hosts`} tone="violet" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <h2 className="mb-4 font-semibold">Booking value by check-in month</h2>
          <RevenueChart data={s.revenueByMonth} />
        </div>
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 font-semibold">Bookings by status</h2>
            <StatusBreakdown data={s.bookingsByStatus} />
          </div>
          <StatCard icon={Percent} label="Occupancy (next 30 days)" value={`${s.totals.occupancyRate}%`} tone="brand" />
        </div>
      </div>
      <div className="card p-6">
        <h2 className="mb-4 font-semibold">Top properties by booking value</h2>
        <ol className="divide-y divide-slate-100 dark:divide-slate-800">
          {s.topProperties.map((p, i) => (
            <li key={p.id} className="flex items-center gap-4 py-3 text-sm">
              <span className="w-6 text-center font-bold text-slate-400">{i + 1}</span>
              <span className="flex-1">{p.title} <span className="text-slate-500">· {p.city}</span></span>
              <span className="font-semibold">{formatCurrency(p.revenue)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
