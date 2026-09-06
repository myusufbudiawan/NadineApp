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
import { MedicationData } from '@/features/care-events/types';
import { useEditableEntry } from '@/features/care-events/useEditableEntry';
import { confirmDestructive } from '@/lib/confirm';
import { colors, space } from '@/lib/design-system/tokens';

// Pure record-keeping — this screen never computes, suggests, or validates a
// dose against a reference range. No dosing-guidance logic belongs here.
export default function AddMedication() {
  const { id, existing, loading } = useEditableEntry('medication');
  const data = existing?.data as MedicationData | undefined;

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
      <ScreenHeader title={id ? 'Edit Medication' : 'Add Medication'} back />
      <EntryForm
        fields={[
          {
            kind: 'text',
            key: 'medicationName',
            label: 'Medication name',
            placeholder: 'e.g. Vitamin D',
            initial: data?.medicationName,
          },
          {
            kind: 'stepper',
            key: 'dose',
            label: 'Dose',
            unit: 'units',
            initial: data?.dose ?? 1,
            step: 0.5,
            rangeMin: 0,
            rangeMax: 20,
          },
          {
            kind: 'segmented',
            key: 'unit',
            label: 'Unit',
            options: ['mg', 'ml', 'IU', 'drops'],
            initial: data?.unit ?? 'mg',
          },
          {
            kind: 'time',
            key: 'scheduledAt',
            label: 'Scheduled/actual time',
            initial: existing ? new Date(existing.occurredAt) : new Date(),
          },
        ]}
        initialNotes={existing?.notes}
        saveLabel={id ? 'Save changes' : 'Save'}
        onSave={async (values, notes) => {
          try {
            const eventData: MedicationData = {
              medicationName: values.medicationName as string,
              dose: values.dose as number,
              unit: values.unit as string,
              scheduledAt: (values.scheduledAt as Date).toISOString(),
            };
            if (id) {
              await editCareEvent(id, {
                occurredAt: values.scheduledAt as Date,
                data: eventData,
                notes: notes || undefined,
              });
            } else {
              await saveCareEvent({
                babyId: LOCAL_BABY_ID,
                type: 'medication',
                occurredAt: values.scheduledAt as Date,
                data: eventData,
                notes: notes || undefined,
              });
            }
            router.back();
          } catch (error) {
            Alert.alert('Could not save medication entry', (error as Error).message);
          }
        }}
      />
      {id && (
        <Button
          variant="destructive"
          onPress={() =>
            confirmDestructive('Delete this medication entry?', 'This cannot be undone.', async () => {
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
