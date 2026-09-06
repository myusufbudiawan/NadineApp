import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ListRow } from '@/components/ui/ListRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TabScreen } from '@/components/ui/Screen';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { careEventRows } from '@/features/care-events/rowConfig';
import { loadLatestCareEvents } from '@/features/care-events/storage';
import { CareEvent, CareEventType } from '@/features/care-events/types';

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
      {careEventRows.map((row) => {
        const event = latest[row.type];
        return (
          <ListRow
            key={row.type}
            icon={row.icon}
            tone={row.tone}
            title={row.title}
            subtitle={event ? row.format(event) : row.emptyLabel}
            onPress={() =>
              router.push((event ? row.historyRoute : row.route) as never)
            }
          />
        );
      })}
    </TabScreen>
  );
}
