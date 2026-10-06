import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uiActions } from '../../features/ui/uiSlice.js';

const STYLES = {
  success: { icon: CircleCheck, cls: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' },
  error: { icon: CircleAlert, cls: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200' },
  info: { icon: Info, cls: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200' },
};

function Toast({ toast }) {
  const dispatch = useDispatch();
  const { icon: Icon, cls } = STYLES[toast.type] || STYLES.info;
  useEffect(() => {
    const t = setTimeout(() => dispatch(uiActions.dismiss(toast.id)), toast.duration);
    return () => clearTimeout(t);
  }, [dispatch, toast.id, toast.duration]);
  return (
    <div className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg ${cls}`} role="status">
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button onClick={() => dispatch(uiActions.dismiss(toast.id))} aria-label="Dismiss notification" className="opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function Toaster() {
  const toasts = useSelector((s) => s.ui.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:items-end" aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}
