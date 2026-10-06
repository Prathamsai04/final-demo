const COLORS = {
  confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  completed: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  cancelled: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  inactive: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  guest: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  owner: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  admin: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${COLORS[status] || COLORS.inactive}`}>
      {status}
    </span>
  );
}
