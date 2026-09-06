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
import { WeightData } from '@/features/care-events/types';
import { useEditableEntry } from '@/features/care-events/useEditableEntry';
import { confirmDestructive } from '@/lib/confirm';
import { colors, space } from '@/lib/design-system/tokens';

export default function AddWeight() {
  const { id, existing, loading } = useEditableEntry('weight');
  const data = existing?.data as WeightData | undefined;

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
      <ScreenHeader title={id ? 'Edit Weight' : 'Add Weight'} back />
      <EntryForm
        fields={[
          {
            kind: 'segmented',
            key: 'unit',
            label: 'Unit',
            options: ['kg', 'lb'],
            initial: data?.unit ?? 'kg',
          },
          {
            kind: 'stepper',
            key: 'value',
            label: 'Weight',
            unit: 'kg',
            initial: data?.value ?? 2,
            step: 0.05,
            rangeMin: 0,
            rangeMax: 6,
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
            const eventData: WeightData = {
              value: values.value as number,
              unit: values.unit as WeightData['unit'],
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
                type: 'weight',
                occurredAt: values.time as Date,
                data: eventData,
                notes: notes || undefined,
              });
            }
            router.back();
          } catch (error) {
            Alert.alert('Could not save weight', (error as Error).message);
          }
        }}
      />
      {id && (
        <Button
          variant="destructive"
          onPress={() =>
            confirmDestructive('Delete this weight entry?', 'This cannot be undone.', async () => {
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
