import { KeyRound, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Spinner } from '../components/common/Feedback.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { authActions } from '../features/auth/authSlice.js';
import { useDocumentTitle } from '../utils/format.js';

const FALLBACK_ACCOUNTS = [
  { role: 'guest', email: 'guest@homestays.demo', password: 'demo1234', name: 'Alex Morgan' },
  { role: 'owner', email: 'owner@homestays.demo', password: 'demo1234', name: 'Priya Sharma' },
  { role: 'admin', email: 'admin@homestays.demo', password: 'demo1234', name: 'Jordan Admin' },
];

export const homeForRole = (role) => (role === 'admin' ? '/admin' : role === 'owner' ? '/owner' : '/');

export function useAuthRedirect() {
  const user = useSelector((s) => s.auth.user);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      const redirect = params.get('redirect');
      navigate(redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : homeForRole(user.role), { replace: true });
    }
  }, [user, params, navigate]);
}

export default function LoginPage() {
  useDocumentTitle('Sign in');
  useAuthRedirect();
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const { status, error } = useSelector((s) => s.auth);
  const meta = useSelector((s) => s.meta);
  const accounts = meta.demoAccounts?.length ? meta.demoAccounts : meta.mode === 'supabase' ? [] : FALLBACK_ACCOUNTS;
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => () => dispatch(authActions.clearAuthError()), [dispatch]);

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    setErrors(errs);
    if (!Object.keys(errs).length) dispatch(authActions.loginRequest(form));
  };

  const quickLogin = (acc) => {
    setForm({ email: acc.email, password: acc.password });
    dispatch(authActions.loginRequest({ email: acc.email, password: acc.password }));
  };

  const loading = status === 'loading';
  return (
    <div className="container-page grid max-w-5xl gap-10 py-12 md:grid-cols-2">
      <div>
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-slate-500">Sign in to book stays and manage your trips.</p>
        <form onSubmit={submit} noValidate className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" className={`input ${errors.password ? 'input-error' : ''}`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <Spinner className="h-4 w-4" /> : <LogIn className="h-4 w-4" />} Sign in
          </button>
          <p className="text-center text-sm text-slate-500">
            New to HomeStays? <Link to={`/register${params.get('redirect') ? `?redirect=${encodeURIComponent(params.get('redirect'))}` : ''}`} className="font-semibold text-brand-600">Create an account</Link>
          </p>
        </form>
      </div>

      {accounts.length > 0 && (
        <div className="card h-fit p-6">
          <h2 className="flex items-center gap-2 font-semibold"><KeyRound className="h-5 w-5 text-brand-600" /> Demo accounts</h2>
          <p className="mt-1 text-sm text-slate-500">One click to sign in. Password for all: <code className="font-mono">demo1234</code></p>
          <ul className="mt-4 space-y-3">
            {accounts.map((acc) => (
              <li key={acc.email}>
                <button className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => quickLogin(acc)} disabled={loading} data-testid={`demo-login-${acc.role}`}>
                  <div>
                    <p className="font-medium">{acc.name}</p>
                    <p className="text-xs text-slate-500">{acc.email}</p>
                  </div>
                  <StatusBadge status={acc.role} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
