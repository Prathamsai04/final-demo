import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageLoader } from './Feedback.jsx';

/** Guards nested routes. Unauthenticated users go to /login; wrong roles see a 403 message. */
export default function ProtectedRoute({ roles }) {
  const { user, token, initialized } = useSelector((s) => s.auth);
  const location = useLocation();

  if (token && !initialized) return <PageLoader />;
  if (!user || !token) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">Access restricted</h1>
        <p className="mt-2 text-slate-500">
          Your account ({user.role}) cannot access this area. Sign in with a {roles.join(' or ')} account.
        </p>
        <a href="/" className="btn-primary mt-6">Back to home</a>
      </div>
    );
  }
  return <Outlet />;
}
