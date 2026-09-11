import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ListRow } from '@/components/ui/ListRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TabScreen } from '@/components/ui/Screen';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { careEventRows } from '@/features/care-events/rowConfig';
import { loadLatestCareEvents } from '@/features/care-events/storage';
import { CareEvent, CareEventType } from '@/features/care-events/types';
import { colors, type } from '@/lib/design-system/tokens';

export default function Track() {
  const [latest, setLatest] = useState<Partial<Record<CareEventType, CareEvent>>>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadLatestCareEvents(LOCAL_BABY_ID).then((events) => {
        if (!active) return;
        const map: Partial<Record<CareEventType, CareEvent>> = {};
        for (const event of events) map[event.type] = event;
        setLatest(map);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <TabScreen>
      <ScreenHeader title="Track" />
      <Text style={{ fontSize: 12, color: colors.muted, marginTop: -8 }}>
        Tap a row to see history, or the + to log now.
      </Text>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.divider }}>
        {careEventRows.map((row) => {
          const event = latest[row.type];
          return (
            <View
              key={row.type}
              style={{ flexDirection: 'row', alignItems: 'stretch' }}
            >
              <View style={{ flex: 1 }}>
                <ListRow
                  icon={row.icon}
                  tone={row.tone}
                  title={row.title}
                  subtitle={event ? row.format(event) : row.emptyLabel}
                  onPress={() =>
                    router.push((event ? row.historyRoute : row.route) as never)
                  }
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Log ${row.title.toLowerCase()} now`}
                onPress={() => router.push(row.route as never)}
                style={{
                  width: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.line,
                }}
              >
                <Ionicons name="add" size={20} color={colors.accentStrong} />
              </Pressable>
            </View>
          );
        })}
      </View>
      <Text style={{ fontSize: 11, color: colors.faint, lineHeight: 17 }}>
        Entries save on this device first and sync when you're back online.
      </Text>
    </TabScreen>
  );
}
