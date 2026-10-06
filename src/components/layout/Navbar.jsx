import { CalendarDays, LayoutDashboard, LogIn, LogOut, Menu, Moon, ShieldCheck, Sun, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { authActions } from '../../features/auth/authSlice.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <img src="/favicon.svg" alt="" className="h-8 w-8" />
      <span>
        Home<span className="text-brand-600">Stays</span>
      </span>
    </Link>
  );
}

const linkCls = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`;

export default function Navbar() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const logout = () => {
    dispatch(authActions.logout());
    navigate('/');
  };

  const links = [
    { to: '/search', label: 'Explore stays' },
    ...(user ? [{ to: '/account/bookings', label: 'My trips' }] : []),
    ...(user && ['owner', 'admin'].includes(user.role) ? [{ to: '/owner', label: 'Host dashboard' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <nav className="container-page flex h-16 items-center justify-between gap-4" aria-label="Main">
        <Logo />
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkCls}>
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost p-2" onClick={toggleTheme} aria-label="Toggle dark mode">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {user ? (
            <div className="relative hidden md:block" ref={menuRef}>
              <button className="flex items-center gap-2 rounded-full border border-slate-200 p-1 pr-3 hover:shadow dark:border-slate-700" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen}>
                <img src={user.avatar || '/placeholder.svg'} alt="" className="h-8 w-8 rounded-full object-cover" />
                <span className="text-sm font-medium">{user.name.split(' ')[0]}</span>
              </button>
              {menuOpen && (
                <div className="card absolute right-0 mt-2 w-64 overflow-hidden p-2" role="menu">
                  <div className="px-3 py-2">
                    <p className="font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                    <div className="mt-1"><StatusBadge status={user.role} /></div>
                  </div>
                  <hr className="my-1 border-slate-200 dark:border-slate-800" />
                  <MenuLink to="/account/bookings" icon={CalendarDays} label="My trips" />
                  {['owner', 'admin'].includes(user.role) && <MenuLink to="/owner" icon={LayoutDashboard} label="Host dashboard" />}
                  {user.role === 'admin' && <MenuLink to="/admin" icon={ShieldCheck} label="Admin console" />}
                  <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={logout} role="menuitem">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className="btn-ghost">
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
              <Link to="/register" className="btn-primary">Sign up</Link>
            </div>
          )}
          <button className="btn-ghost p-2 md:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkCls}>
                {l.label}
              </NavLink>
            ))}
            <hr className="my-2 border-slate-200 dark:border-slate-800" />
            {user ? (
              <>
                <p className="px-3 text-sm text-slate-500">Signed in as {user.name} ({user.role})</p>
                <button className="btn-secondary mt-2" onClick={logout}>
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" className="btn-secondary">Sign in</Link>
                <Link to="/register" className="btn-primary">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800" role="menuitem">
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}
