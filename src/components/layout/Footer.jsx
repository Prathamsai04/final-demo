import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white py-10 text-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="container-page grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-lg font-extrabold">
            Home<span className="text-brand-600">Stays</span>
          </p>
          <p className="mt-2 max-w-sm text-slate-500">
            Discover handpicked homestays around the world. This is a demo application — payments are simulated and no real charges are made.
          </p>
        </div>
        <div>
          <p className="font-semibold">Explore</p>
          <ul className="mt-2 space-y-1 text-slate-500">
            <li><Link to="/search" className="hover:text-brand-600">All stays</Link></li>
            <li><Link to="/search?destination=India" className="hover:text-brand-600">India</Link></li>
            <li><Link to="/search?amenities=pool" className="hover:text-brand-600">Stays with a pool</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Hosting</p>
          <ul className="mt-2 space-y-1 text-slate-500">
            <li><Link to="/owner" className="hover:text-brand-600">Host dashboard</Link></li>
            <li><Link to="/owner/listings/new" className="hover:text-brand-600">List your home</Link></li>
            <li><Link to="/register" className="hover:text-brand-600">Become a host</Link></li>
          </ul>
        </div>
      </div>
      <p className="container-page mt-8 text-xs text-slate-400">© {new Date().getFullYear()} HomeStays demo. Photos from Unsplash.</p>
    </footer>
  );
}
