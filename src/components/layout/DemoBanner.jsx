import { Database, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useDemoMode } from '../../context/DemoModeContext.jsx';
import { ConfirmDialog } from '../common/Modal.jsx';

export default function DemoBanner() {
  const { mode, isDemo, resetDemo } = useDemoMode();
  const [confirm, setConfirm] = useState(false);
  if (!isDemo) return null;
  return (
    <div className="bg-slate-900 text-xs text-slate-100 dark:bg-black">
      <div className="container-page flex flex-wrap items-center justify-between gap-2 py-2">
        <p className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-brand-400" />
          <span>
            <strong className="text-brand-300">Demo mode</strong> — seeded data; your bookings & edits are saved in this browser.
            {mode === 'offline' && <span className="ml-1 text-amber-300">(API unreachable)</span>}
          </span>
        </p>
        <button className="inline-flex items-center gap-1 font-semibold text-brand-300 hover:text-brand-200" onClick={() => setConfirm(true)}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset demo data
        </button>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Reset demo data?"
        message="This removes all bookings, cancellations, listings and accounts you created in this browser and restores the original seed data."
        confirmLabel="Reset data"
        danger
        onConfirm={resetDemo}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
