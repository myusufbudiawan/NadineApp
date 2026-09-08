import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { EntryForm } from '@/components/forms/EntryForm';
import { WeekdayToggle } from '@/components/forms/WeekdayToggle';
import { Button } from '@/components/ui/Button';
import { FormScreen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors } from '@/lib/design-system/tokens';
import { confirmDestructive } from '@/lib/confirm';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { reminderTypeLabels, reminderTypes } from '@/features/reminders/types';
import {
  completeReminder,
  createReminder,
  editReminder,
  loadReminder,
  removeReminder,
  ReminderView,
  snoozeReminder,
} from '@/features/reminders/storage';

const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const typeOptions = reminderTypes.map((t) => reminderTypeLabels[t]);

function timeToDate(timeOfDay: string): Date {
  const [h, m] = timeOfDay.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date;
}

function dateToTimeOfDay(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function AddReminder() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [existing, setExisting] = useState<ReminderView | undefined>();
  const [loading, setLoading] = useState(Boolean(id));
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    if (!id) return;
    loadReminder(id).then((reminder) => {
      setExisting(reminder);
      if (reminder) setDaysOfWeek(reminder.daysOfWeek);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <FormScreen>
        <Text style={{ color: colors.muted }}>Loading…</Text>
      </FormScreen>
    );
  }

  return (
    <FormScreen>
      <ScreenHeader title={id ? 'Edit Reminder' : 'Add Reminder'} back />
      <EntryForm
        fields={[
          {
            kind: 'segmented',
            key: 'type',
            label: 'Type',
            options: typeOptions,
            initial: reminderTypeLabels[existing?.type ?? 'general'],
          },
          {
            kind: 'text',
            key: 'title',
            label: 'Title',
            placeholder: 'e.g. Feed baby',
            initial: existing?.title,
          },
          {
            kind: 'time',
            key: 'timeOfDay',
            label: 'Time',
            initial: existing ? timeToDate(existing.timeOfDay) : new Date(),
          },
        ]}
        showNotes={false}
        saveLabel={id ? 'Save changes' : 'Save'}
        onSave={async (values) => {
          if (daysOfWeek.length === 0) {
            Alert.alert('Pick at least one day', 'Choose which days this reminder repeats on.');
            return;
          }
          try {
            const type = reminderTypes.find(
              (t) => reminderTypeLabels[t] === values.type,
            )!;
            const title = (values.title as string).trim();
            if (!title) {
              Alert.alert('Title required', 'Give this reminder a short title.');
              return;
            }
            const timeOfDay = dateToTimeOfDay(values.timeOfDay as Date);
            if (id) {
              await editReminder(id, { type, title, timeOfDay, daysOfWeek, timezone: deviceTimezone });
            } else {
              await createReminder({
                babyId: LOCAL_BABY_ID,
                type,
                title,
                timeOfDay,
                daysOfWeek,
                timezone: deviceTimezone,
              });
            }
            router.back();
          } catch (error) {
            Alert.alert('Could not save reminder', (error as Error).message);
          }
        }}
      >
        <WeekdayToggle value={daysOfWeek} onChange={setDaysOfWeek} />
      </EntryForm>
      {id && existing && (
        <>
          <Button
            onPress={async () => {
              await completeReminder(id);
              router.back();
            }}
          >
            Mark done for today
          </Button>
          <Button
            onPress={async () => {
              await snoozeReminder(id, 15);
              router.back();
            }}
          >
            Snooze 15 min
          </Button>
          <Button
            variant="destructive"
            onPress={() =>
              confirmDestructive('Delete this reminder?', 'This cannot be undone.', async () => {
                await removeReminder(id);
                router.back();
              })
            }
          >
            Delete reminder
          </Button>
        </>
      )}
    </FormScreen>
  );
}
