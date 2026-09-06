import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { loadCareEventHistory } from './storage';
import { CareEvent, CareEventType } from './types';

// Add-X screens double as edit screens when opened with ?id=<eventId> from
// the history list (Section 1.10). Resolves the existing event (if any)
// before the caller renders its EntryForm, so initial field values are
// correct on first mount.
export function useEditableEntry(type: CareEventType) {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [existing, setExisting] = useState<CareEvent | null | undefined>(
    id ? undefined : null,
  );

  useEffect(() => {
    if (!id) {
      setExisting(null);
      return;
    }
    let active = true;
    loadCareEventHistory(LOCAL_BABY_ID, type).then((events) => {
      if (!active) return;
      setExisting(events.find((event) => event.id === id) ?? null);
    });
    return () => {
      active = false;
    };
  }, [id, type]);

  return {
    id: id as string | undefined,
    existing: existing ?? null,
    loading: Boolean(id) && existing === undefined,
  };
}
