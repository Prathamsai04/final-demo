import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../utils/format.js';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-slate-500">The page may have moved, or the link might be broken.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn-primary">Go home</Link>
        <Link to="/search" className="btn-secondary">Explore stays</Link>
      </div>
    </div>
  );
}
