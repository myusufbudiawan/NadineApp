import { Text, View } from 'react-native';
import { EncouragementCard } from '@/components/domain/EncouragementCard';
import { GrowthChart } from '@/components/domain/GrowthChart';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TabScreen } from '@/components/ui/Screen';
import { colors, type } from '@/lib/design-system/tokens';
import { useState } from 'react';
export default function Growth() {
  const [metric, setMetric] = useState('Weight');
  return (
    <TabScreen>
      <ScreenHeader title="Growth" />
      <SegmentedControl
        options={['Weight', 'Length', 'Head Circ.']}
        value={metric}
        onChange={setMetric}
        tone="pink"
      />
      <Text style={{ fontSize: type.label, color: colors.muted }}>
        Corrected age{' '}
        <Text style={{ color: colors.pink, fontWeight: '800' }}>
          6 days (33w 2d)
        </Text>
      </Text>
      <GrowthChart />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Latest</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
            1.68 kg
          </Text>
          <Text style={{ color: colors.green, fontSize: 12, marginTop: 8 }}>
            +0.05 kg vs yesterday
          </Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            Birth weight
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
            1.58 kg
          </Text>
          <Text style={{ color: colors.violet, fontSize: 12, marginTop: 8 }}>
            +0.10 kg vs last 7 days
          </Text>
        </Card>
      </View>
      <EncouragementCard
        title="Great progress!"
        message="Aisyah is growing well."
        icon="star-outline"
      />
    </TabScreen>
  );
}
