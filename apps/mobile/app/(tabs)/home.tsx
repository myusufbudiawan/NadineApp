import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { BabyHeroCard } from '@/components/domain/BabyHeroCard';
import { EncouragementCard } from '@/components/domain/EncouragementCard';
import { MetricCard } from '@/components/domain/MetricCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TabScreen } from '@/components/ui/Screen';
import { colors, type } from '@/lib/design-system/tokens';
export default function Home() {
  return (
    <TabScreen>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text style={{ color: colors.muted, fontSize: type.label }}>
            Good morning,
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: type.title,
              fontWeight: '800',
            }}
          >
            Mama <Text style={{ color: colors.pink }}>♥</Text>
          </Text>
        </View>
        <Ionicons
          accessibilityLabel="Notifications"
          name="notifications-outline"
          size={22}
          color={colors.text}
        />
      </View>
      <BabyHeroCard />
      <Text
        style={{ fontSize: type.label, fontWeight: '800', color: colors.text }}
      >
        Today at a glance
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <MetricCard
          icon="scale-outline"
          tone="pink"
          value="1.68"
          unit="kg"
          caption="+0.05 kg vs yesterday"
        />
        <MetricCard
          icon="water-outline"
          tone="violet"
          value="36"
          unit="ml"
          caption="Every 3 hrs · Last feed"
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <MetricCard
          icon="moon-outline"
          tone="blue"
          value="7h 20m"
          caption="Total sleep"
        />
        <MetricCard
          icon="happy-outline"
          tone="yellow"
          value="6"
          caption="Diapers (Wet 5 / Dirty 1)"
        />
      </View>
      <EncouragementCard
        title="Today’s goal"
        message="Keep going Mama! You’re doing an amazing job."
      />
    </TabScreen>
  );
}
