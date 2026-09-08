import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { listConflicts } from '@/lib/offline/database';
import { runSync, SyncSummary } from '@/lib/offline/sync';

const BACKGROUND_INTERVAL_MS = 60_000;

// Cross-feature (hooks/, per the mandatory folder structure in Section 0.A):
// runs the sync engine whenever the app becomes active and on a background
// interval while it stays active, and tracks how many conflicts are waiting
// for the caregiver so a screen can surface a badge without polling SQLite
// itself. Mounted once at the root layout, gated on `enabled` — every server
// route now requires a signed-in Supabase session, so this stays idle (no
// requests, no 401 spam) until the root layout passes `enabled: true`.
export function useSync(enabled: boolean) {
  const [syncing, setSyncing] = useState(false);
  const [lastSummary, setLastSummary] = useState<SyncSummary | null>(null);
  const [conflictCount, setConflictCount] = useState(0);
  const mounted = useRef(true);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const summary = await runSync();
      if (mounted.current) setLastSummary(summary);
    } finally {
      if (mounted.current) setSyncing(false);
    }
    const conflicts = await listConflicts();
    if (mounted.current) setConflictCount(conflicts.length);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    mounted.current = true;
    sync();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    const interval = setInterval(sync, BACKGROUND_INTERVAL_MS);

    return () => {
      mounted.current = false;
      subscription.remove();
      clearInterval(interval);
    };
  }, [enabled, sync]);

  return { syncing, lastSummary, conflictCount, sync };
}
