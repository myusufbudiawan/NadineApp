import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { PhotoBlurToggle } from '@/components/domain/PhotoBlurToggle';
import { usePhotoBlur } from '@/features/privacy/PhotoBlurContext';
import { colors, numerals, radius, type } from '@/lib/design-system/tokens';

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
  const { blurred } = usePhotoBlur();
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
              ? `${name}'s photo. Activate to view, long-press to change.`
              : `View ${name}'s photo`
            : `Add a photo of ${name}`
        }
        style={{
          height: imageUrl ? 230 : 96,
          borderRadius: radius.lg,
          overflow: 'hidden',
          backgroundColor: colors.graySoft,
          // Empty state is a framed prompt, not a photo: no scrim over it, so
          // the label is never covered by the contrast gradient (it used to be
          // gold 10px text sitting under the dark band).
          borderWidth: imageUrl ? 0 : 1,
          borderColor: colors.line,
          justifyContent: 'center',
          alignItems: imageUrl ? 'center' : 'stretch',
        }}
      >
        {imageUrl ? (
          <>
            <Image
              source={{ uri: imageUrl }}
              blurRadius={blurred ? 26 : 0}
              style={{ width: '100%', height: '100%' }}
            />
            <LinearGradient
              colors={['rgba(32,31,29,0)', 'rgba(32,31,29,0.55)']}
              locations={[0.55, 1]}
              pointerEvents="none"
              style={{ position: 'absolute', inset: 0 }}
            />
            <View style={{ position: 'absolute', left: 16, right: 16, bottom: 12 }}>
              <Text style={{ fontSize: 50, fontFamily: type.fontHeading, color: '#ffffff' }}>
                {name}
              </Text>
              {bornSummary && (
                <Text style={{ fontSize: type.micro, color: '#ffffff', opacity: 0.9, marginTop: 2 }}>
                  {bornSummary}
                </Text>
              )}
            </View>
          </>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingHorizontal: 18,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="camera-outline" size={20} color={colors.accentDeep} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: type.small, color: colors.text, fontFamily: type.fontBodyMedium }}>
                Add a photo
              </Text>
              <Text style={{ fontSize: type.micro, color: colors.muted, lineHeight: 17 }}>
                Choose a photo from this device. It stays in this browser.
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
      {!imageUrl && (
        <View style={{ marginTop: 14, gap: 3 }}>
          <Text
            role="heading"
            aria-level={2}
            style={{ fontSize: 40, fontFamily: type.fontHeading, color: colors.text }}
          >
            {name}
          </Text>
          {bornSummary && (
            <Text style={{ fontSize: type.caption, color: colors.muted }}>{bornSummary}</Text>
          )}
        </View>
      )}
      {imageUrl && <PhotoBlurToggle style={{ position: 'absolute', top: 12, right: 12 }} />}
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
          <Text
            style={{
              color: colors.muted,
              fontSize: type.micro,
              letterSpacing: type.capsSpacing,
              textTransform: 'uppercase',
            }}
          >
            Actual age
          </Text>
          <Text style={{ fontSize: 24, fontFamily: type.fontHeading, color: colors.text, marginTop: 6, ...numerals }}>
            {actualAge?.label ?? '—'}
          </Text>
          <Text style={{ fontSize: type.caption, color: colors.muted, marginTop: 3 }}>
            {actualAge?.sub ?? ''}
          </Text>
        </View>
        <View style={{ flex: 1, padding: 14 }}>
          <Text
            style={{
              color: colors.accentDeep,
              fontSize: type.micro,
              letterSpacing: type.capsSpacing,
              textTransform: 'uppercase',
            }}
          >
            Corrected age
          </Text>
          <Text style={{ fontSize: 24, fontFamily: type.fontHeading, color: colors.accentDeep, marginTop: 6, ...numerals }}>
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
