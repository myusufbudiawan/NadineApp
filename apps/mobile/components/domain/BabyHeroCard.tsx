import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, space, type } from '@/lib/design-system/tokens';
export function BabyHeroCard({
  name = 'Aisyah',
  imageUrl,
}: {
  name?: string;
  imageUrl?: string;
}) {
  return (
    <Card
      accessibilityLabel={`${name}'s profile`}
      style={{
        backgroundColor: colors.pinkSoft,
        borderColor: 'transparent',
        padding: space.md,
      }}
    >
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View
          style={{
            width: 112,
            height: 205,
            borderRadius: 14,
            overflow: 'hidden',
            backgroundColor: '#E8D7CE',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <Ionicons name="heart" size={38} color={colors.pink} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
            {name} <Text style={{ color: colors.pink }}>♥</Text>
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: type.caption,
              marginTop: 5,
            }}
          >
            Born 32w 3d · 1.58 kg
          </Text>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: '#F4DCE1',
              marginTop: 19,
              paddingTop: 12,
            }}
          >
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              Actual age
            </Text>
            <Text
              style={{ fontSize: 25, fontWeight: '800', color: colors.text }}
            >
              20 days
            </Text>
            <Text style={{ fontSize: type.caption, color: colors.muted }}>
              (34w 2d)
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 13 }}>
              Corrected age
            </Text>
            <Text
              style={{ fontSize: 25, fontWeight: '800', color: colors.text }}
            >
              6 days
            </Text>
            <Text style={{ fontSize: type.caption, color: colors.muted }}>
              (33w 2d)
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}
