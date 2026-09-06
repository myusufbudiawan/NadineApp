import { Text, View } from 'react-native';
import { colors, type } from '@/lib/design-system/tokens';
export function GrowthChart() {
  return (
    <View
      accessibilityLabel="Growth chart: Aisyah's weight rises from 0.9 to 1.68 kilograms over 6 corrected weeks"
      style={{ height: 245, paddingTop: 15 }}
    >
      <View
        style={{
          flex: 1,
          borderLeftWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.line,
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            height: '62%',
            backgroundColor: colors.pinkSoft,
            transform: [{ skewY: '-15deg' }],
            opacity: 0.9,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '23%',
            height: 3,
            backgroundColor: colors.pink,
            transform: [{ rotate: '-16deg' }],
          }}
        />
        {[0, 1, 2].map((item) => (
          <View
            key={item}
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.pink,
              left: `${item * 28 + 12}%`,
              bottom: `${item * 15 + 23}%`,
            }}
          />
        ))}
      </View>
      <Text
        style={{
          alignSelf: 'center',
          marginTop: 12,
          fontSize: type.caption,
          color: colors.muted,
        }}
      >
        Corrected age (weeks)
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 18,
          marginTop: 12,
        }}
      >
        <Text style={{ fontSize: 11, color: colors.muted }}>
          ● <Text style={{ color: colors.text }}>Aisyah</Text>
        </Text>
        <Text style={{ fontSize: 11, color: colors.pink }}>
          ● <Text style={{ color: colors.muted }}>10th – 90th percentile</Text>
        </Text>
      </View>
    </View>
  );
}
