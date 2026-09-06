import { Ionicons } from '@expo/vector-icons';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, space, type } from '@/lib/design-system/tokens';
export function BabyHeroCard({
  name = 'Your baby',
  imageUrl,
  bornSummary,
  actualAge,
  correctedAge,
  onPressPhoto,
}: {
  name?: string;
  imageUrl?: string;
  bornSummary?: string;
  actualAge?: { label: string; sub: string };
  correctedAge?: { label: string; sub: string };
  onPressPhoto?: () => void;
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
        <TouchableOpacity
          onPress={onPressPhoto}
          disabled={!onPressPhoto}
          accessibilityRole={onPressPhoto ? 'button' : undefined}
          accessibilityLabel={
            imageUrl ? `Change ${name}'s photo` : `Add a photo of ${name}`
          }
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
            <>
              <Ionicons name="heart" size={38} color={colors.pink} />
              {onPressPhoto && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Ionicons name="camera" size={14} color={colors.pink} />
                  <Text style={{ fontSize: 10, color: colors.pink, fontWeight: '700' }}>
                    Add photo
                  </Text>
                </View>
              )}
            </>
          )}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
            {name} <Text style={{ color: colors.pink }}>♥</Text>
          </Text>
          {bornSummary && (
            <Text
              style={{
                color: colors.muted,
                fontSize: type.caption,
                marginTop: 5,
              }}
            >
              {bornSummary}
            </Text>
          )}
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
              {actualAge?.label ?? '—'}
            </Text>
            <Text style={{ fontSize: type.caption, color: colors.muted }}>
              {actualAge?.sub ?? ''}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 13 }}>
              Corrected age
            </Text>
            <Text
              style={{ fontSize: 25, fontWeight: '800', color: colors.text }}
            >
              {correctedAge?.label ?? '—'}
            </Text>
            <Text style={{ fontSize: type.caption, color: colors.muted }}>
              {correctedAge?.sub ?? ''}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}
