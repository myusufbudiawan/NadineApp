import { router } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { EntryForm } from '@/components/forms/EntryForm';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import {
  deleteCareEvent,
  editCareEvent,
  saveCareEvent,
} from '@/features/care-events/storage';
import { FeedingData } from '@/features/care-events/types';
import { useEditableEntry } from '@/features/care-events/useEditableEntry';
import { confirmDestructive } from '@/lib/confirm';
import { colors, space, type } from '@/lib/design-system/tokens';

export default function AddFeeding() {
  const { id, existing, loading } = useEditableEntry('feeding');
  const data = existing?.data as FeedingData | undefined;

  if (loading) {
    return (
      <View style={{ flex: 1, padding: space.xl, backgroundColor: colors.canvas }}>
        <Text style={{ color: colors.muted }}>Loading…</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        padding: space.xl,
        gap: space.lg,
        backgroundColor: colors.canvas,
      }}
    >
      <ScreenHeader title={id ? 'Edit Feeding' : 'Add Feeding'} back />
      <EntryForm
        fields={[
          {
            kind: 'segmented',
            key: 'method',
            options: ['Bottle', 'Breastmilk'],
            initial: data?.method ?? 'Bottle',
          },
          {
            kind: 'stepper',
            key: 'amount',
            label: 'Amount',
            unit: 'ml',
            initial: data?.amount ?? 36,
            rangeMin: 20,
            rangeMax: 50,
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
            const eventData: FeedingData = {
              method: values.method as FeedingData['method'],
              amount: values.amount as number,
              unit: 'ml',
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
                type: 'feeding',
                occurredAt: values.time as Date,
                data: eventData,
                notes: notes || undefined,
              });
            }
            router.back();
          } catch (error) {
            Alert.alert('Could not save feeding', (error as Error).message);
          }
        }}
      />
      {id && (
        <Button
          variant="destructive"
          onPress={() =>
            confirmDestructive('Delete this feeding entry?', 'This cannot be undone.', async () => {
              await deleteCareEvent(id);
              router.back();
            })
          }
        >
          Delete entry
        </Button>
      )}
    </View>
  );
}
