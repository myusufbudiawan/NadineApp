import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Share, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormScreen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, space, type } from '@/lib/design-system/tokens';
import { confirmDestructive } from '@/lib/confirm';
import { ApiError } from '@/lib/api/client';
import {
  cancelAccountDeletion,
  DeletionRequest,
  exportAccountData,
  listDeletionRequests,
  requestAccountDeletion,
} from '@/lib/api/privacy';

export default function Settings() {
  const [exporting, setExporting] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<DeletionRequest>();
  const [requestingDeletion, setRequestingDeletion] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listDeletionRequests()
        .then((requests) => {
          if (active) setPendingDeletion(requests.find((r) => r.status === 'pending'));
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <FormScreen>
      <ScreenHeader title="Settings" back />

      <Card style={{ gap: space.sm }}>
        <Text style={{ fontSize: type.label, fontWeight: '700', color: colors.text }}>
          Your data
        </Text>
        <Text style={{ color: colors.muted, fontSize: type.caption }}>
          Download a copy of everything stored for this account — babies, care events,
          measurements, reminders, and sharing history.
        </Text>
        <Button
          disabled={exporting}
          onPress={async () => {
            setExporting(true);
            try {
              const data = await exportAccountData();
              await Share.share({
                message: JSON.stringify(data, null, 2),
                title: 'PreemieTrack account export',
              });
            } catch (err) {
              Alert.alert(
                'Could not export your data',
                err instanceof ApiError ? err.message : 'Something went wrong.',
              );
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting ? 'Preparing export…' : 'Export my data'}
        </Button>
      </Card>

      <Card style={{ gap: space.sm }}>
        <Text style={{ fontSize: type.label, fontWeight: '700', color: colors.text }}>
          Account deletion
        </Text>
        {pendingDeletion ? (
          <>
            <Text style={{ color: colors.muted, fontSize: type.caption }}>
              A deletion request is pending review, requested{' '}
              {new Date(pendingDeletion.requestedAt).toLocaleDateString()}. Final data-retention
              timing is still being finalized — you can cancel any time before it's processed.
            </Text>
            <Button
              variant="destructive"
              onPress={async () => {
                await cancelAccountDeletion(pendingDeletion.id);
                setPendingDeletion(undefined);
              }}
            >
              Cancel deletion request
            </Button>
          </>
        ) : (
          <>
            <Text style={{ color: colors.muted, fontSize: type.caption }}>
              Request permanent deletion of this account and its data. A team member reviews
              every request before anything is removed.
            </Text>
            <Button
              variant="destructive"
              disabled={requestingDeletion}
              onPress={() =>
                confirmDestructive(
                  'Request account deletion?',
                  "This starts the deletion review process. You can cancel it any time before it's processed.",
                  async () => {
                    setRequestingDeletion(true);
                    try {
                      const request = await requestAccountDeletion();
                      setPendingDeletion(request);
                    } catch (err) {
                      Alert.alert(
                        'Could not submit request',
                        err instanceof ApiError ? err.message : 'Something went wrong.',
                      );
                    } finally {
                      setRequestingDeletion(false);
                    }
                  },
                )
              }
            >
              Request account deletion
            </Button>
          </>
        )}
      </Card>
    </FormScreen>
  );
}
