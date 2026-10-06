import { UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Spinner } from '../components/common/Feedback.jsx';
import { authActions } from '../features/auth/authSlice.js';
import { useDocumentTitle } from '../utils/format.js';
import { useAuthRedirect } from './LoginPage.jsx';

export function validateRegistration(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.';
  if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.';
  if (form.confirm !== form.password) errors.confirm = 'Passwords do not match.';
  return errors;
}

export default function RegisterPage() {
  useDocumentTitle('Create account');
  useAuthRedirect();
  const dispatch = useDispatch();
  const { status, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'guest' });
  const [errors, setErrors] = useState({});

  useEffect(() => () => dispatch(authActions.clearAuthError()), [dispatch]);

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setErrors({ ...errors, [k]: undefined });
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validateRegistration(form);
    setErrors(errs);
    if (!Object.keys(errs).length) {
      dispatch(authActions.registerRequest({ name: form.name, email: form.email, password: form.password, role: form.role }));
    }
  };

  const loading = status === 'loading';
  return (
    <div className="container-page max-w-md py-12">
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="mt-2 text-slate-500">Book unique stays or start hosting in minutes.</p>
      <form onSubmit={submit} noValidate className="mt-8 space-y-4">
        <fieldset>
          <legend className="label">I want to</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'guest', l: 'Book stays' },
              { v: 'owner', l: 'Host my home' },
            ].map((o) => (
              <label key={o.v} className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-medium ${form.role === o.v ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-slate-300 dark:border-slate-700'}`}>
                <input type="radio" name="role" value={o.v} className="sr-only" checked={form.role === o.v} onChange={set('role')} />
                {o.l}
              </label>
            ))}
          </div>
        </fieldset>
        {[
          { k: 'name', label: 'Full name', type: 'text', auto: 'name' },
          { k: 'email', label: 'Email', type: 'email', auto: 'email' },
          { k: 'password', label: 'Password', type: 'password', auto: 'new-password' },
          { k: 'confirm', label: 'Confirm password', type: 'password', auto: 'new-password' },
        ].map((f) => (
          <div key={f.k}>
            <label className="label" htmlFor={f.k}>{f.label}</label>
            <input id={f.k} type={f.type} autoComplete={f.auto} className={`input ${errors[f.k] ? 'input-error' : ''}`} value={form[f.k]} onChange={set(f.k)} />
            {errors[f.k] && <p className="field-error">{errors[f.k]}</p>}
          </div>
        ))}
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />} Create account
        </button>
        <p className="text-center text-xs text-slate-500">In demo mode your account is stored only in this browser.</p>
        <p className="text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-brand-600">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
