import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { FormScreen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, type } from '@/lib/design-system/tokens';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { formatReminderSubtitle, reminderTypeConfig } from '@/features/reminders/rowConfig';
import { loadReminders, ReminderView } from '@/features/reminders/storage';
import { reminderTypeLabels } from '@/features/reminders/types';

export default function Reminders() {
  const [reminders, setReminders] = useState<ReminderView[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadReminders(LOCAL_BABY_ID).then((list) => {
        if (active) setReminders(list);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <FormScreen>
      <ScreenHeader
        title="Reminders"
        back
        right={
          <Text
            accessibilityRole="button"
            onPress={() => router.push('/more/add-reminder')}
            style={{ color: colors.violet, fontWeight: '700', fontSize: type.body }}
          >
            + Add
          </Text>
        }
      />
      {reminders.length === 0 && (
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Text style={{ color: colors.muted, fontSize: type.body, textAlign: 'center' }}>
            No reminders yet. Add one to get a gentle nudge for feeding, medication, or
            measurements.
          </Text>
        </Card>
      )}
      {reminders.map((reminder) => (
        <ListRow
          key={reminder.id}
          icon={reminderTypeConfig[reminder.type].icon}
          tone={reminderTypeConfig[reminder.type].tone}
          title={`${reminder.title} · ${reminderTypeLabels[reminder.type]}`}
          subtitle={formatReminderSubtitle(reminder)}
          onPress={() => router.push(`/more/add-reminder?id=${reminder.id}`)}
        />
      ))}
    </FormScreen>
  );
}
