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
        backgroundColor: colors.pinkSoft,
        borderColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: type.label,
            fontWeight: '800',
            color: colors.text,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            marginTop: 8,
            color: colors.text,
            fontSize: type.label,
            lineHeight: 20,
          }}
        >
          {message}
        </Text>
      </View>
      <Ionicons name={icon} size={46} color={colors.pink} />
    </Card>
  );
}
