import '@/lib/webAlert';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond';
import { Lora_400Regular, Lora_600SemiBold, useFonts } from '@expo-google-fonts/lora';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/lib/design-system/tokens';
import { KeyboardDoneBar } from '@/components/ui/KeyboardDoneBar';
import { CelebrationHost } from '@/components/celebration/CelebrationHost';
import { PhotoBlurProvider } from '@/features/privacy/PhotoBlurContext';
import { ensureDemoSeeded } from '@/lib/demo/seed';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useSync } from '@/hooks/useSync';
import { OFFLINE_ONLY, WEB_DEMO } from '@/lib/offlineOnly';

// The app is laid out for a phone — on a wide browser window, show it as a
// phone-width column instead of stretching every card across the screen.
const webFrame = {
  flex: 1,
  width: '100%',
  maxWidth: 480,
  alignSelf: 'center',
  backgroundColor: colors.canvas,
  boxShadow: '0 0 24px rgba(0, 0, 0, 0.08)',
} as const;
export default function RootLayout() {
  // Drains the offline mutation queue on launch, on every foreground, and
  // on a background interval (Section 11 5.1) — mounted once at the root so
  // it runs regardless of which tab/screen is active. Every server route
  // now requires a signed-in account, so there's nothing to sync until
  // someone is actually logged in.
  const { session } = useAuthSession();
  useSync(Boolean(session) && !OFFLINE_ONLY);
  const [fontsLoaded] = useFonts({
    CormorantGaramond_600SemiBold,
    Lora_400Regular,
    Lora_600SemiBold,
  });
  // Web demo: the sample baby must exist before any screen reads storage,
  // whichever URL the visitor opened first.
  const [demoReady, setDemoReady] = useState(!WEB_DEMO);
  useEffect(() => {
    if (!WEB_DEMO) return;
    ensureDemoSeeded()
      .catch((err) => console.warn('demo seed failed', err))
      .finally(() => setDemoReady(true));
  }, []);
  if (!fontsLoaded || !demoReady) {
    return <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }
  return (
    <SafeAreaProvider style={WEB_DEMO ? webFrame : undefined}>
      <PhotoBlurProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="baby-setup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="track/add-feeding"
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="track/add-weight"
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="track/add-diaper"
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="track/add-sleep"
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="track/add-temperature"
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="track/add-medication"
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="track/add-note"
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="track/add-growth"
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="track/history/[type]"
            options={{ presentation: 'card' }}
          />
          <Stack.Screen name="more/reminders" options={{ presentation: 'card' }} />
          <Stack.Screen name="more/add-reminder" options={{ presentation: 'card' }} />
          <Stack.Screen name="more/sync-conflicts" options={{ presentation: 'card' }} />
          <Stack.Screen name="more/milestones" options={{ presentation: 'card' }} />
        </Stack>
        <KeyboardDoneBar />
        {/* Milestone celebrations play over the whole app, whatever screen is up. */}
        <CelebrationHost />
      </PhotoBlurProvider>
    </SafeAreaProvider>
  );
}
