import { Tabs } from 'expo-router/tabs';
import { BottomTabBar } from '@/components/ui/BottomTabBar';
import { ThemedScreen } from '@/features/theme/ThemeProvider';

// A real tab navigator (not a Slot + router.replace) so tab screens stay
// mounted across switches — that's what avoids the every-tap remount flash.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      screenLayout={({ children }) => <ThemedScreen>{children}</ThemedScreen>}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="track" />
      <Tabs.Screen name="growth" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
