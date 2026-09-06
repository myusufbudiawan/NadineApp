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
import { DiaperData } from '@/features/care-events/types';
import { useEditableEntry } from '@/features/care-events/useEditableEntry';
import { confirmDestructive } from '@/lib/confirm';
import { colors } from '@/lib/design-system/tokens';

export default function AddDiaper() {
  const { id, existing, loading } = useEditableEntry('diaper');
  const data = existing?.data as DiaperData | undefined;

  if (loading) {
    return (
      <FormScreen>
        <Text style={{ color: colors.muted }}>Loading…</Text>
      </FormScreen>
    );
  }

  return (
    <FormScreen>
      <ScreenHeader title={id ? 'Edit Diaper' : 'Add Diaper'} back />
      <EntryForm
        fields={[
          {
            kind: 'segmented',
            key: 'diaperType',
            label: 'Type',
            options: ['Wet', 'Dirty', 'Both', 'Other'],
            initial: data?.diaperType ?? 'Wet',
          },
          {
            kind: 'time',
            key: 'time',
            label: 'Time',
            initial: existing ? new Date(existing.occurredAt) : new Date(),
          },
        ]}
        initialNotes={existing?.notes}
        saveLabel={id ? 'Save changes' : 'Save'}
        onSave={async (values, notes) => {
          try {
            const eventData: DiaperData = {
              diaperType: values.diaperType as DiaperData['diaperType'],
            };
            if (id) {
              await editCareEvent(id, {
                occurredAt: values.time as Date,
                data: eventData,
                notes: notes || undefined,
              });
            } else {
              await saveCareEvent({
                babyId: LOCAL_BABY_ID,
                type: 'diaper',
                occurredAt: values.time as Date,
                data: eventData,
                notes: notes || undefined,
              });
            }
            router.back();
          } catch (error) {
            Alert.alert('Could not save diaper change', (error as Error).message);
          }
        }}
      />
      {id && (
        <Button
          variant="destructive"
          onPress={() =>
            confirmDestructive('Delete this diaper entry?', 'This cannot be undone.', async () => {
              await deleteCareEvent(id);
              router.back();
            })
          }
        >
          Delete entry
        </Button>
      )}
    </FormScreen>
  );
}
