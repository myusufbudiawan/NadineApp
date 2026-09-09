import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, type } from '@/lib/design-system/tokens';
export function EncouragementCard({
  title,
  message,
  icon = 'heart-outline',
}: {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Card
      style={{
        backgroundColor: colors.accentSoft,
        borderColor: colors.accent,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 10,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: colors.accent,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            marginTop: 8,
            color: colors.accentDeep,
            fontSize: type.label,
            fontFamily: type.fontBody,
            lineHeight: 20,
          }}
        >
          {message}
        </Text>
      </View>
      <Ionicons name={icon} size={40} color={colors.accent} />
    </Card>
  );
}
