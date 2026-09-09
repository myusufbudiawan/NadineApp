import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TabScreen } from '@/components/ui/Screen';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { loadBabyProfile } from '@/features/baby-profile/storage';
import { BabyProfile } from '@/features/baby-profile/types';
import { actualAge } from '@/lib/age';
import { listBabies } from '@/lib/api/babies';
import { colors, type } from '@/lib/design-system/tokens';

const items = [
  { title: 'Profile & Baby Info', icon: 'person-circle-outline' as const, route: '/baby-setup' },
  { title: 'Reminders', icon: 'notifications-outline' as const, route: '/more/reminders' },
  { title: 'Reports', icon: 'document-text-outline' as const, route: '/more/reports' },
  { title: 'Share Data', icon: 'share-social-outline' as const, route: '/more/share-data' },
  { title: 'Settings', icon: 'settings-outline' as const, route: '/more/settings' },
  { title: 'Sync Conflicts', icon: 'sync-outline' as const, route: '/more/sync-conflicts' },
  { title: 'Help & Support', icon: 'help-circle-outline' as const, route: '/more/help' },
  { title: 'About PreemieTrack', icon: 'information-circle-outline' as const, route: '/more/about' },
];

export default function More() {
  const [profile, setProfile] = useState<BabyProfile>();
  const [hasMultipleBabies, setHasMultipleBabies] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadBabyProfile(LOCAL_BABY_ID).then((p) => {
        if (active) setProfile(p);
      });
      listBabies()
        .then((babies) => {
          if (active) setHasMultipleBabies(babies.length > 1);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );

  const visibleItems = hasMultipleBabies
    ? [
        ...items.slice(0, 1),
        { title: 'Switch Baby', icon: 'swap-horizontal-outline' as const, route: '/select-baby' },
        ...items.slice(1),
      ]
    : items;

  const initial = profile?.name?.trim()?.[0]?.toUpperCase() ?? '?';
  const bornSummary = profile
    ? `Born on ${new Date(profile.dateOfBirth).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`
    : 'Add your baby’s details to get started';
  let ageWeightSummary: string | undefined;
  if (profile) {
    const age = actualAge(new Date(profile.dateOfBirth));
    ageWeightSummary = `${age.weeks}w ${age.days}d${
      profile.birthWeightKg ? ` · ${profile.birthWeightKg} kg` : ''
    }`;
  }

  return (
    <TabScreen>
      <ScreenHeader title="More" />
      <Card
        style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}
        accessibilityLabel="Baby profile summary, tap Profile & Baby Info below to edit"
      >
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: colors.line,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {profile?.photoUri ? (
            <Image
              source={{ uri: profile.photoUri }}
              style={{ width: 54, height: 54 }}
              accessibilityLabel={`${profile.name || 'Baby'}'s photo`}
            />
          ) : (
            <Text style={{ color: colors.accentStrong, fontFamily: type.fontHeading, fontSize: 23 }}>{initial}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: type.fontHeading,
              fontSize: type.body,
              color: colors.text,
            }}
          >
            {profile?.name || 'Your baby'} <Text style={{ color: colors.pink }}>♥</Text>
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: type.caption,
              marginTop: 4,
            }}
          >
            {bornSummary}
          </Text>
          {ageWeightSummary && (
            <Text style={{ color: colors.muted, fontSize: type.caption }}>
              {ageWeightSummary}
            </Text>
          )}
        </View>
      </Card>
      {visibleItems.map((item) => (
        <ListRow
          key={item.title}
          icon={item.icon}
          title={item.title}
          tone="gray"
          onPress={item.route ? () => router.push(item.route as never) : undefined}
        />
      ))}
    </TabScreen>
  );
}
