import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { FormScreen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, space, type } from '@/lib/design-system/tokens';
import appConfig from '../../app.json';

export default function About() {
  return (
    <FormScreen>
      <ScreenHeader title="About PreemieTrack" back />

      <View style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.md }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: radius.lg,
            backgroundColor: colors.pinkSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="heart" size={30} color={colors.pink} />
        </View>
        <Text style={{ fontSize: type.title, fontFamily: type.fontHeading, color: colors.text }}>
          {appConfig.expo.name}
        </Text>
        <Text style={{ color: colors.muted, fontSize: type.caption }}>
          Version {appConfig.expo.version}
        </Text>
      </View>

      <Card style={{ gap: space.sm }}>
        <Text style={{ fontSize: type.label, fontFamily: type.fontBodyMedium, color: colors.text }}>
          Our mission
        </Text>
        <Text style={{ color: colors.muted, fontSize: type.caption, lineHeight: 19 }}>
          PreemieTrack helps families of premature babies track feeding, sleep, growth, and
          daily care — with corrected age front and center, so progress is measured against
          the milestones that actually apply.
        </Text>
      </Card>

      <Card style={{ gap: space.sm }}>
        <Text style={{ fontSize: type.label, fontFamily: type.fontBodyMedium, color: colors.text }}>
          A note on medical advice
        </Text>
        <Text style={{ color: colors.muted, fontSize: type.caption, lineHeight: 19 }}>
          PreemieTrack is a tracking tool, not a medical device. Nothing in this app is a
          diagnosis or treatment recommendation — always follow the guidance of your baby's
          care team.
        </Text>
      </Card>

      <Card style={{ gap: space.sm }}>
        <Text style={{ fontSize: type.label, fontFamily: type.fontBodyMedium, color: colors.text }}>
          Legal
        </Text>
        <Text style={{ color: colors.muted, fontSize: type.caption }}>
          Privacy policy and terms of service are still being finalized and will appear here
          once published.
        </Text>
      </Card>

      <Text style={{ color: colors.muted, fontSize: type.caption, textAlign: 'center' }}>
        Made with care for preemie families.
      </Text>
    </FormScreen>
  );
}
