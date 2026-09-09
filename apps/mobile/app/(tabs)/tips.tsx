import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TabScreen } from '@/components/ui/Screen';
import { colors, type } from '@/lib/design-system/tokens';
const topics = [
  {
    title: 'Feeding & Nutrition',
    icon: 'water-outline' as const,
    tone: 'violet' as const,
  },
  {
    title: 'Growth & Development',
    icon: 'trending-up-outline' as const,
    tone: 'blue' as const,
  },
  { title: 'Sleep', icon: 'moon-outline' as const, tone: 'violet' as const },
  {
    title: 'Daily Care',
    icon: 'happy-outline' as const,
    tone: 'yellow' as const,
  },
  {
    title: 'Emotional Support',
    icon: 'heart-outline' as const,
    tone: 'pink' as const,
  },
];
export default function Tips() {
  return (
    <TabScreen>
      <ScreenHeader title="Tips" />
      <Text
        style={{ fontSize: type.label, fontFamily: type.fontHeading, color: colors.text }}
      >
        For you today
      </Text>
      <Card
        style={{
          backgroundColor: colors.accentSoft,
          borderColor: colors.accent,
          minHeight: 190,
          overflow: 'hidden',
        }}
      >
        <View style={{ flex: 1, justifyContent: 'center', paddingRight: 96 }}>
          <Text style={{ fontSize: 19, fontFamily: type.fontHeading, color: colors.text }}>
            Kangaroo Care
          </Text>
          <Text style={{ color: colors.muted, lineHeight: 20, marginTop: 8 }}>
            Skin-to-skin contact helps support comfort, temperature and bonding.
          </Text>
        </View>
        <Ionicons
          name="heart"
          size={78}
          color={colors.pink}
          style={{ position: 'absolute', right: 22, bottom: 24 }}
        />
      </Card>
      <Text
        style={{ fontSize: type.label, fontFamily: type.fontHeading, color: colors.text }}
      >
        All topics
      </Text>
      {topics.map((topic) => (
        <ListRow key={topic.title} {...topic} />
      ))}
    </TabScreen>
  );
}
