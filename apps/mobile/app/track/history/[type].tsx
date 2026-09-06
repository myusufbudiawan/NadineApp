import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { IconChip } from '@/components/ui/IconChip';
import { FormScreen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { careEventRows, formatTime, groupEventsByDay } from '@/features/care-events/rowConfig';
import { deleteCareEvent, loadCareEventHistory } from '@/features/care-events/storage';
import { CareEvent, CareEventType } from '@/features/care-events/types';
import { colors, radius, space, type as typeScale } from '@/lib/design-system/tokens';
import { confirmDestructive } from '@/lib/confirm';

export default function CareEventHistory() {
  const { type } = useLocalSearchParams<{ type: CareEventType }>();
  const config = careEventRows.find((row) => row.type === type);
  const [events, setEvents] = useState<CareEvent[]>([]);

  const load = useCallback(() => {
    loadCareEventHistory(LOCAL_BABY_ID, type).then(setEvents);
  }, [type]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!config) return null;

  const dayGroups = groupEventsByDay(events);

  return (
    <FormScreen>
      <ScreenHeader title={config.title} back />
      <ScrollView contentContainerStyle={{ gap: space.lg }}>
        {events.length === 0 && (
          <Text style={{ color: colors.muted, fontSize: typeScale.body }}>{config.emptyLabel}</Text>
        )}
        {dayGroups.map((group) => (
          <View key={group.label + group.events[0].id} style={{ gap: space.sm }}>
            <Text
              style={{
                fontSize: typeScale.caption,
                fontWeight: '700',
                color: colors.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {group.label}
            </Text>
            <View style={{ gap: space.md }}>
              {group.events.map((event) => (
                <View
                  key={event.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.md,
                    paddingVertical: space.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.line,
                  }}
                >
                  <IconChip icon={config.icon} tone={config.tone} label="" />
                  <Pressable
                    style={{ flex: 1 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${config.title.toLowerCase()} entry from ${formatTime(event.occurredAt)}`}
                    onPress={() => router.push(`${config.route}?id=${event.id}` as never)}
                  >
                    <Text style={{ fontSize: typeScale.body, fontWeight: '700', color: colors.text }}>
                      {config.format(event)}
                    </Text>
                    {event.notes ? (
                      <Text style={{ marginTop: 3, color: colors.muted, fontSize: typeScale.caption }}>
                        {event.notes}
                      </Text>
                    ) : null}
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${config.title.toLowerCase()} entry from ${formatTime(event.occurredAt)}`}
                    hitSlop={12}
                    onPress={() =>
                      confirmDestructive(
                        `Delete this ${config.title.toLowerCase()} entry?`,
                        'This cannot be undone.',
                        async () => {
                          await deleteCareEvent(event.id);
                          load();
                        },
                      )
                    }
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <Button onPress={() => router.push(config.route as never)} style={{ borderRadius: radius.sm }}>
        Add {config.title}
      </Button>
    </FormScreen>
  );
}
