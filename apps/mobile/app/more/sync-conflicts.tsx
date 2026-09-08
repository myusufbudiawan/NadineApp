import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormScreen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, space, type } from '@/lib/design-system/tokens';
import { loadConflicts, resolveAcceptServer, resolveKeepLocal } from '@/features/sync/storage';
import { SyncConflict } from '@/features/sync/types';

// Section 11 5.1's explicit conflict resolution UX: when the same care event
// was edited on two devices, the sync engine (lib/offline/sync.ts) never
// silently overwrites either side — it stores the conflict here for the
// caregiver to resolve.
export default function SyncConflicts() {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const reload = useCallback(() => {
    loadConflicts().then(setConflicts);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function keepLocal(conflict: SyncConflict) {
    setResolvingId(conflict.id);
    await resolveKeepLocal(conflict);
    setResolvingId(null);
    reload();
  }

  async function useServer(conflict: SyncConflict) {
    setResolvingId(conflict.id);
    await resolveAcceptServer(conflict);
    setResolvingId(null);
    reload();
  }

  return (
    <FormScreen>
      <ScreenHeader title="Sync Conflicts" back />
      {conflicts.length === 0 && (
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Text style={{ color: colors.muted, fontSize: type.body, textAlign: 'center' }}>
            No conflicts. Every entry from this device matches what's on the server.
          </Text>
        </Card>
      )}
      {conflicts.map((conflict) => (
        <Card key={conflict.id} style={{ gap: space.md }}>
          <Text style={{ fontWeight: '700', fontSize: type.body, color: colors.text }}>
            This entry was also edited on another device
          </Text>
          <View style={{ gap: 4 }}>
            <Text style={{ color: colors.muted, fontSize: type.caption, fontWeight: '700' }}>
              Your version (this device)
            </Text>
            <Text style={{ color: colors.text, fontSize: type.caption }}>
              {conflict.localPayload.notes ?? 'No notes'}
            </Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ color: colors.muted, fontSize: type.caption, fontWeight: '700' }}>
              Server version (other device)
            </Text>
            <Text style={{ color: colors.text, fontSize: type.caption }}>
              {conflict.serverEvent.notes ?? 'No notes'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button
              style={{ flex: 1 }}
              disabled={resolvingId === conflict.id}
              accessibilityLabel="Keep this device's version"
              onPress={() => keepLocal(conflict)}
            >
              Keep mine
            </Button>
            <Button
              style={{ flex: 1, backgroundColor: colors.line }}
              disabled={resolvingId === conflict.id}
              accessibilityLabel="Use the other device's version"
              onPress={() => useServer(conflict)}
            >
              Use theirs
            </Button>
          </View>
        </Card>
      ))}
    </FormScreen>
  );
}
