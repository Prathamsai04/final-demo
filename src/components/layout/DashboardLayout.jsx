import { CalendarDays, House, LayoutDashboard, Plus, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const ICONS = { dashboard: LayoutDashboard, home: House, plus: Plus, calendar: CalendarDays, users: Users };

export default function DashboardLayout({ title, nav }) {
  return (
    <div className="container-page py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:pb-0" aria-label={title}>
            {nav.map((item) => {
              const Icon = ICONS[item.icon] || House;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end ?? true}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <section className="min-w-0 flex-1">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
