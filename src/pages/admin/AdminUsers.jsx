import { Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { ConfirmDialog } from '../../components/common/Modal.jsx';
import { ErrorState, Skeleton, Spinner } from '../../components/common/Feedback.jsx';
import { adminActions } from '../../features/admin/adminSlice.js';
import { formatDate, useDocumentTitle } from '../../utils/format.js';

export default function AdminUsers() {
  useDocumentTitle('Manage users');
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);
  const { users, busyIds } = useSelector((s) => s.admin);
  const [query, setQuery] = useState('');
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    dispatch(adminActions.usersRequest());
  }, [dispatch]);

  useEffect(() => {
    if (toDelete && !users.data.some((u) => u.id === toDelete.id)) setToDelete(null);
  }, [users.data, toDelete]);

  const list = useMemo(() => {
    const q = query.toLowerCase();
    return users.data.filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q));
  }, [users.data, query]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <label className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, email, role" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search users" />
        </label>
      </div>
      {users.status === 'failed' ? (
        <ErrorState message={users.error} onRetry={() => dispatch(adminActions.usersRequest())} />
      ) : users.status !== 'succeeded' && users.data.length === 0 ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Activity</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.map((u) => {
                const busy = busyIds.includes(u.id);
                const self = u.id === me.id;
                return (
                  <tr key={u.id} data-testid="admin-user-row">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar || '/placeholder.svg'} alt="" className="h-9 w-9 rounded-full object-cover" />
                        <div>
                          <p className="font-medium">{u.name}{self && <span className="ml-1 text-xs text-slate-500">(you)</span>}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        className="input w-28 py-1.5"
                        value={u.role}
                        disabled={busy || self}
                        onChange={(e) => dispatch(adminActions.userUpdateRequest({ id: u.id, changes: { role: e.target.value } }))}
                        aria-label={`Role for ${u.name}`}
                      >
                        <option value="guest">guest</option>
                        <option value="owner">owner</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="p-4"><StatusBadge status={u.status} /></td>
                    <td className="p-4 text-slate-500">{u.bookingCount} bookings · {u.propertyCount} listings</td>
                    <td className="p-4 text-slate-500">{formatDate(u.createdAt?.slice(0, 10))}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {busy && <Spinner className="h-4 w-4" />}
                        <button
                          className="btn-secondary btn-sm"
                          disabled={busy || self}
                          onClick={() => dispatch(adminActions.userUpdateRequest({ id: u.id, changes: { status: u.status === 'active' ? 'suspended' : 'active' } }))}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                        <button className="btn-secondary btn-sm text-red-600" disabled={busy || self} onClick={() => setToDelete(u)} aria-label={`Delete ${u.name}`}>
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
        title="Delete user?"
        message={toDelete && `${toDelete.name} (${toDelete.email}) will be removed. Users with active bookings cannot be deleted — suspend them instead.`}
        confirmLabel="Delete user"
        danger
        loading={toDelete && busyIds.includes(toDelete.id)}
        onConfirm={() => dispatch(adminActions.userDeleteRequest(toDelete.id))}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
