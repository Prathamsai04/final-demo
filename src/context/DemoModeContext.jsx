import { createContext, useCallback, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { overlayChangeCount, resetDemoData, saveAuth, loadAuth } from '../api/demoStorage.js';

const DemoModeContext = createContext(null);

/** Exposes the data mode (demo/supabase) and demo-only helpers such as resetting local changes. */
export function DemoModeProvider({ children }) {
  const mode = useSelector((s) => s.meta.mode);
  const isDemo = mode === 'demo' || mode === 'unknown' || mode === 'offline';

  const resetDemo = useCallback(() => {
    resetDemoData();
    // Accounts registered during the demo live in the overlay; sign them out on reset.
    const auth = loadAuth();
    if (auth?.user && !auth.user.email.endsWith('@homestays.demo')) saveAuth(null);
    window.location.assign('/');
  }, []);

  const value = useMemo(() => ({ mode, isDemo, resetDemo, changeCount: () => overlayChangeCount() }), [mode, isDemo, resetDemo]);
  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export const useDemoMode = () => useContext(DemoModeContext);
