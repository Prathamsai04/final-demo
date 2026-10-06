import { Eye, House, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import SafeImage from '../../components/common/SafeImage.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { ConfirmDialog } from '../../components/common/Modal.jsx';
import { EmptyState, ErrorState, Skeleton, Spinner } from '../../components/common/Feedback.jsx';
import { ownerActions } from '../../features/owner/ownerSlice.js';
import { formatCurrency, useDocumentTitle } from '../../utils/format.js';

export default function OwnerListings() {
  useDocumentTitle('My listings');
  const dispatch = useDispatch();
  const { properties, busyIds } = useSelector((s) => s.owner);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    dispatch(ownerActions.propertiesRequest());
  }, [dispatch]);

  useEffect(() => {
    if (toDelete && !properties.data.some((p) => p.id === toDelete.id)) setToDelete(null);
  }, [properties.data, toDelete]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">My listings</h1>
        <Link to="/owner/listings/new" className="btn-primary"><Plus className="h-4 w-4" /> New listing</Link>
      </div>

      {properties.status === 'failed' ? (
        <ErrorState message={properties.error} onRetry={() => dispatch(ownerActions.propertiesRequest())} />
      ) : properties.status !== 'succeeded' && properties.data.length === 0 ? (
        <div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : properties.data.length === 0 ? (
        <EmptyState icon={House} title="No listings yet" message="Create your first listing to start receiving bookings." action={<Link to="/owner/listings/new" className="btn-primary">Create listing</Link>} />
      ) : (
        <ul className="space-y-3">
          {properties.data.map((p) => {
            const busy = busyIds.includes(p.id);
            return (
              <li key={p.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center" data-testid="owner-listing">
                <SafeImage src={p.images?.[0]} alt="" className="h-24 w-full rounded-xl sm:w-32" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{p.title}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-sm text-slate-500">{p.city}, {p.country} · {p.type} · up to {p.maxGuests} guests</p>
                  <p className="text-sm">
                    <strong>{formatCurrency(p.pricePerNight)}</strong>/night · {p.upcomingBookings} upcoming booking{p.upcomingBookings === 1 ? '' : 's'}
                    {p.blockedDates?.length ? ` · ${p.blockedDates.length} blocked range(s)` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/properties/${p.id}`} className="btn-ghost btn-sm"><Eye className="h-4 w-4" /> View</Link>
                  <Link to={`/owner/listings/${p.id}/edit`} className="btn-secondary btn-sm"><Pencil className="h-4 w-4" /> Edit</Link>
                  <button
                    className="btn-secondary btn-sm"
                    disabled={busy}
                    onClick={() => dispatch(ownerActions.propertyStatusRequest({ id: p.id, status: p.status === 'active' ? 'inactive' : 'active' }))}
                  >
                    {busy ? <Spinner className="h-4 w-4" /> : <Power className="h-4 w-4" />} {p.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn-secondary btn-sm text-red-600" disabled={busy} onClick={() => setToDelete(p)} aria-label={`Delete ${p.title}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete listing?"
        message={toDelete && `“${toDelete.title}” will be permanently removed. Listings with upcoming bookings cannot be deleted — deactivate them instead.`}
        confirmLabel="Delete"
        danger
        loading={toDelete && busyIds.includes(toDelete.id)}
        onConfirm={() => {
          dispatch(ownerActions.deleteRequest(toDelete.id));
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
