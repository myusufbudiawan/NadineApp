import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, space, type } from '@/lib/design-system/tokens';
const points = [
  {
    icon: 'bar-chart-outline' as const,
    title: 'Track everything',
    copy: 'Log feeds, weight, diapers, sleep and more.',
  },
  {
    icon: 'trending-up-outline' as const,
    title: 'Growth with confidence',
    copy: 'Follow growth with corrected-age context.',
  },
  {
    icon: 'bulb-outline' as const,
    title: 'Personalized tips',
    copy: 'Helpful guidance tailored to your baby’s stage.',
  },
];
export default function Onboarding() {
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: space.xl,
        justifyContent: 'center',
        gap: space.xl,
      }}
    >
      <View>
        <Text style={{ fontSize: 36, fontWeight: '800', color: colors.text }}>
          Preemie<Text style={{ color: colors.pink }}>Track</Text>
        </Text>
        <Text
          style={{
            fontSize: type.body,
            color: colors.muted,
            marginTop: space.sm,
          }}
        >
          A calm place for your baby’s daily care and growth.
        </Text>
      </View>
      {points.map((item) => (
        <View
          key={item.title}
          style={{ flexDirection: 'row', gap: space.lg, alignItems: 'center' }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.pinkSoft,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name={item.icon} size={28} color={colors.pink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 18, fontWeight: '800', color: colors.text }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                color: colors.muted,
                fontSize: type.label,
                lineHeight: 20,
              }}
            >
              {item.copy}
            </Text>
          </View>
        </View>
      ))}
      <Card
        style={{ backgroundColor: colors.pinkSoft, borderColor: 'transparent' }}
      >
        <Text
          style={{ fontSize: type.body, fontWeight: '800', color: colors.text }}
        >
          Your baby’s data is private
        </Text>
        <Text
          style={{
            marginTop: 6,
            color: colors.muted,
            fontSize: type.label,
            lineHeight: 20,
          }}
        >
          We use secure storage for your session. You control your baby’s
          information and sharing.
        </Text>
      </Card>
      <Button onPress={() => router.push('/baby-setup')}>Get started</Button>
      <Text
        accessibilityRole="link"
        onPress={() => router.replace('/(tabs)/home')}
        style={{
          textAlign: 'center',
          color: colors.violet,
          fontSize: type.label,
          fontWeight: '700',
        }}
      >
        I already have an account
      </Text>
    </ScrollView>
  );
}
