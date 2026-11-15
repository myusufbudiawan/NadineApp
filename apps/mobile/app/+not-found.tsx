import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { FormScreen } from '@/components/ui/Screen';
import { colors, space, type } from '@/lib/design-system/tokens';

// Reached by any unknown URL — common in the web demo, where a shared link can
// lose a path segment. It has to look like the app, not like Expo's default
// unstyled "Not found", and it has to offer a way back.
export default function NotFound() {
  return (
    <FormScreen>
      <View style={{ flex: 1, justifyContent: 'center', gap: space.md, paddingBottom: space.xxl }}>
        <Text
          style={{
            fontSize: type.micro,
            letterSpacing: type.capsSpacing,
            textTransform: 'uppercase',
            color: colors.accentDeep,
          }}
        >
          PreemieTrack
        </Text>
        <Text
          role="heading"
          aria-level={1}
          style={{ fontSize: type.display, fontFamily: type.fontHeading, color: colors.text }}
        >
          That page isn&apos;t here
        </Text>
        <Text style={{ fontSize: type.body, color: colors.muted, lineHeight: 23 }}>
          The link may be from an older version of the demo, or a path that was never built. Nothing
          is broken and nothing was lost: your entries stay in this browser.
        </Text>
        <View style={{ marginTop: space.md, alignSelf: 'flex-start', minWidth: 200 }}>
          <Button onPress={() => router.replace('/')}>Back to today</Button>
        </View>
      </View>
    </FormScreen>
  );
}
