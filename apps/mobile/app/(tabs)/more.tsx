import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TabScreen } from '@/components/ui/Screen';
import { colors, type } from '@/lib/design-system/tokens';
const items = [
  { title: 'Profile & Baby Info', icon: 'person-circle-outline' as const },
  { title: 'Reminders', icon: 'notifications-outline' as const },
  { title: 'Reports', icon: 'document-text-outline' as const },
  { title: 'Share Data', icon: 'share-social-outline' as const },
  { title: 'Settings', icon: 'settings-outline' as const },
  { title: 'Help & Support', icon: 'help-circle-outline' as const },
  { title: 'About PreemieTrack', icon: 'information-circle-outline' as const },
];
export default function More() {
  return (
    <TabScreen>
      <ScreenHeader title="More" />
      <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: colors.pink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.white, fontSize: 23 }}>A</Text>
        </View>
        <View>
          <Text
            style={{
              fontWeight: '800',
              fontSize: type.body,
              color: colors.text,
            }}
          >
            Aisyah <Text style={{ color: colors.pink }}>♥</Text>
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: type.caption,
              marginTop: 4,
            }}
          >
            Born on 15 May 2025
          </Text>
          <Text style={{ color: colors.muted, fontSize: type.caption }}>
            32w 3d · 1.58 kg
          </Text>
        </View>
      </Card>
      {items.map((item) => (
        <ListRow key={item.title} {...item} tone="gray" />
      ))}
    </TabScreen>
  );
}
