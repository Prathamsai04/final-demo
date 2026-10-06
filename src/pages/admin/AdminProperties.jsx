import { Eye, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import SafeImage from '../../components/common/SafeImage.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { ConfirmDialog } from '../../components/common/Modal.jsx';
import { ErrorState, Skeleton, Spinner } from '../../components/common/Feedback.jsx';
import { adminActions } from '../../features/admin/adminSlice.js';
import { formatCurrency, useDocumentTitle } from '../../utils/format.js';

export default function AdminProperties() {
  useDocumentTitle('Manage properties');
  const dispatch = useDispatch();
  const { properties, busyIds } = useSelector((s) => s.admin);
  const [query, setQuery] = useState('');
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    dispatch(adminActions.propertiesRequest());
  }, [dispatch]);

  useEffect(() => {
    if (toDelete && !properties.data.some((p) => p.id === toDelete.id)) setToDelete(null);
  }, [properties.data, toDelete]);

  const list = useMemo(() => {
    const q = query.toLowerCase();
    return properties.data.filter((p) => !q || [p.title, p.city, p.country, p.owner?.name].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [properties.data, query]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Properties</h1>
        <label className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search title, city, host" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search properties" />
        </label>
      </div>
      {properties.status === 'failed' ? (
        <ErrorState message={properties.error} onRetry={() => dispatch(adminActions.propertiesRequest())} />
      ) : properties.status !== 'succeeded' && properties.data.length === 0 ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <th className="p-4">Property</th>
                <th className="p-4">Host</th>
                <th className="p-4">Price</th>
                <th className="p-4">Upcoming</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.map((p) => {
                const busy = busyIds.includes(p.id);
                return (
                  <tr key={p.id}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <SafeImage src={p.images?.[0]} alt="" className="h-12 w-16 rounded-lg" />
                        <div>
                          <p className="font-medium">{p.title}</p>
                          <p className="text-xs text-slate-500">{p.city}, {p.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{p.owner?.name || '—'}</td>
                    <td className="p-4">{formatCurrency(p.pricePerNight)}</td>
                    <td className="p-4">{p.upcomingBookings}</td>
                    <td className="p-4"><StatusBadge status={p.status} /></td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {busy && <Spinner className="h-4 w-4" />}
                        <Link to={`/properties/${p.id}`} className="btn-ghost btn-sm" aria-label={`View ${p.title}`}><Eye className="h-4 w-4" /></Link>
                        <select
                          className="input w-32 py-1.5"
                          value={p.status}
                          disabled={busy}
                          onChange={(e) => dispatch(adminActions.propertyUpdateRequest({ id: p.id, status: e.target.value }))}
                          aria-label={`Status for ${p.title}`}
                        >
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                          <option value="suspended">suspended</option>
                        </select>
                        <button className="btn-secondary btn-sm text-red-600" disabled={busy} onClick={() => setToDelete(p)} aria-label={`Delete ${p.title}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete property?"
        message={toDelete && `“${toDelete.title}” will be permanently removed. Properties with upcoming bookings cannot be deleted — suspend them instead.`}
        confirmLabel="Delete property"
        danger
        loading={toDelete && busyIds.includes(toDelete.id)}
        onConfirm={() => dispatch(adminActions.propertyDeleteRequest(toDelete.id))}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
