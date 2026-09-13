import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, type } from '@/lib/design-system/tokens';

// Matches the design's hero pattern: a full-width photo with the baby's
// name/born-summary overlaid on a bottom gradient scrim, and the
// actual/corrected age readout as a bordered two-column block underneath —
// not a card-with-side-photo layout.
export function BabyHeroCard({
  name = 'Your baby',
  imageUrl,
  bornSummary,
  actualAge,
  correctedAge,
  onPressPhoto,
  onLongPressPhoto,
}: {
  name?: string;
  imageUrl?: string;
  bornSummary?: string;
  actualAge?: { label: string; sub: string };
  correctedAge?: { label: string; sub: string };
  // Tap: view the photo full-screen (only wired up when one exists).
  onPressPhoto?: () => void;
  // Long-press: pick/change the photo (owner-only — undefined for viewers).
  onLongPressPhoto?: () => void;
}) {
  // No photo yet: a single tap adds one (there's nothing to view, and
  // making a first-time user long-press to find the picker is a bad
  // affordance). Once a photo exists: tap views it full-screen, long-press
  // changes it.
  const tapHandler = imageUrl ? onPressPhoto : onLongPressPhoto;
  const longPressHandler = imageUrl ? onLongPressPhoto : undefined;
  const interactive = Boolean(tapHandler || longPressHandler);
  return (
    <View accessibilityLabel={`${name}'s profile`}>
      <TouchableOpacity
        onPress={tapHandler}
        onLongPress={longPressHandler}
        disabled={!interactive}
        activeOpacity={interactive ? 0.85 : 1}
        accessibilityRole={interactive ? 'button' : undefined}
        accessibilityLabel={
          imageUrl
            ? longPressHandler
              ? `${name}'s photo. Tap to view, long-press to change.`
              : `View ${name}'s photo`
            : `Add a photo of ${name}`
        }
        style={{
          height: 230,
          borderRadius: radius.lg,
          overflow: 'hidden',
          backgroundColor: colors.graySoft,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Ionicons name="person" size={52} color={colors.accent} />
            {onLongPressPhoto && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="camera" size={14} color={colors.accent} />
                <Text style={{ fontSize: 10, color: colors.accent, fontFamily: type.fontBodyMedium }}>
                  Add a photo of your baby
                </Text>
              </View>
            )}
          </View>
        )}
        <LinearGradient
          colors={['rgba(32,31,29,0)', 'rgba(32,31,29,0.55)']}
          locations={[0.55, 1]}
          pointerEvents="none"
          style={{ position: 'absolute', inset: 0 }}
        />
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 12 }}>
          <Text style={{ fontSize: 50, fontFamily: type.fontHeading, color: colors.white }}>
            {name}
          </Text>
          {bornSummary && (
            <Text style={{ fontSize: 11, color: colors.white, opacity: 0.9, marginTop: 2 }}>
              {bornSummary}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <View
        style={{
          flexDirection: 'row',
          marginTop: 18,
          borderWidth: 1,
          borderColor: colors.divider,
          borderRadius: radius.md,
          overflow: 'hidden',
        }}
      >
        <View style={{ flex: 1, padding: 14, borderRightWidth: 1, borderRightColor: colors.divider }}>
          <Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Actual age
          </Text>
          <Text style={{ fontSize: 24, fontFamily: type.fontHeading, color: colors.text, marginTop: 6 }}>
            {actualAge?.label ?? '—'}
          </Text>
          <Text style={{ fontSize: type.caption, color: colors.muted, marginTop: 3 }}>
            {actualAge?.sub ?? ''}
          </Text>
        </View>
        <View style={{ flex: 1, padding: 14 }}>
          <Text style={{ color: colors.accent, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Corrected age
          </Text>
          <Text style={{ fontSize: 24, fontFamily: type.fontHeading, color: colors.accentStrong, marginTop: 6 }}>
            {correctedAge?.label ?? '—'}
          </Text>
          <Text style={{ fontSize: type.caption, color: colors.muted, marginTop: 3 }}>
            {correctedAge?.sub ?? ''}
          </Text>
        </View>
      </View>
    </View>
  );
}
