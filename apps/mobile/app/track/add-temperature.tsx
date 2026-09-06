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
import { TemperatureData } from '@/features/care-events/types';
import { useEditableEntry } from '@/features/care-events/useEditableEntry';
import { confirmDestructive } from '@/lib/confirm';
import { colors, space } from '@/lib/design-system/tokens';

export default function AddTemperature() {
  const { id, existing, loading } = useEditableEntry('temperature');
  const data = existing?.data as TemperatureData | undefined;

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
      <ScreenHeader title={id ? 'Edit Temperature' : 'Add Temperature'} back />
      <EntryForm
        fields={[
          {
            kind: 'segmented',
            key: 'unit',
            label: 'Unit',
            options: ['C', 'F'],
            initial: data?.unit ?? 'C',
          },
          {
            kind: 'segmented',
            key: 'method',
            label: 'Method',
            options: ['Oral', 'Axillary', 'Temporal', 'Rectal', 'Other'],
            initial: data?.method ?? 'Axillary',
          },
          {
            kind: 'stepper',
            key: 'value',
            label: 'Temperature',
            unit: '°',
            initial: data?.value ?? 37,
            step: 0.1,
            rangeMin: 35,
            rangeMax: 40,
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
            const eventData: TemperatureData = {
              value: values.value as number,
              unit: values.unit as TemperatureData['unit'],
              method: values.method as TemperatureData['method'],
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
                type: 'temperature',
                occurredAt: values.time as Date,
                data: eventData,
                notes: notes || undefined,
              });
            }
            router.back();
          } catch (error) {
            Alert.alert('Could not save temperature', (error as Error).message);
          }
        }}
      />
      {id && (
        <Button
          variant="destructive"
          onPress={() =>
            confirmDestructive('Delete this temperature entry?', 'This cannot be undone.', async () => {
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
