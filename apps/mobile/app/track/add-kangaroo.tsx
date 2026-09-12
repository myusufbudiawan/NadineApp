import { router } from 'expo-router';
import { Alert, Text } from 'react-native';
import { EntryForm } from '@/components/forms/EntryForm';
import { Button } from '@/components/ui/Button';
import { FormScreen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import {
  deleteCareEvent,
  editCareEvent,
  saveCareEvent,
} from '@/features/care-events/storage';
import { KangarooCareData } from '@/features/care-events/types';
import { useEditableEntry } from '@/features/care-events/useEditableEntry';
import { confirmDestructive } from '@/lib/confirm';
import { colors } from '@/lib/design-system/tokens';

const thirtyMinutesAgo = () => new Date(Date.now() - 30 * 60 * 1000);

export default function AddKangarooCare() {
  const { id, existing, loading } = useEditableEntry('kangaroo');
  const data = existing?.data as KangarooCareData | undefined;

  if (loading) {
    return (
      <FormScreen>
        <Text style={{ color: colors.muted }}>Loading…</Text>
      </FormScreen>
    );
  }

  return (
    <FormScreen>
      <ScreenHeader title={id ? 'Edit Kangaroo Care' : 'Add Kangaroo Care'} back />
      <EntryForm
        fields={[
          {
            kind: 'time',
            key: 'startAt',
            label: 'Start time',
            initial: data ? new Date(data.startAt) : thirtyMinutesAgo(),
          },
          {
            kind: 'time',
            key: 'endAt',
            label: 'End time',
            initial: data ? new Date(data.endAt) : new Date(),
          },
        ]}
        initialNotes={existing?.notes}
        saveLabel={id ? 'Save changes' : 'Save'}
        onSave={async (values, notes) => {
          try {
            const startAt = values.startAt as Date;
            const endAt = values.endAt as Date;
            const eventData: KangarooCareData = {
              startAt: startAt.toISOString(),
              endAt: endAt.toISOString(),
            };
            if (id) {
              await editCareEvent(id, {
                occurredAt: endAt,
                data: eventData,
                notes: notes || undefined,
              });
            } else {
              await saveCareEvent({
                babyId: LOCAL_BABY_ID,
                type: 'kangaroo',
                occurredAt: endAt,
                data: eventData,
                notes: notes || undefined,
              });
            }
            router.back();
          } catch (error) {
            Alert.alert('Could not save kangaroo care', (error as Error).message);
          }
        }}
      />
      {id && (
        <Button
          variant="destructive"
          onPress={() =>
            confirmDestructive(
              'Delete this kangaroo care entry?',
              'This cannot be undone.',
              async () => {
                await deleteCareEvent(id);
                router.back();
              },
            )
          }
        >
          Delete entry
        </Button>
      )}
    </FormScreen>
  );
}
