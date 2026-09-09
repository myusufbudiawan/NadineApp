import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond';
import { Lora_400Regular, Lora_600SemiBold, useFonts } from '@expo-google-fonts/lora';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/lib/design-system/tokens';
import { KeyboardDoneBar } from '@/components/ui/KeyboardDoneBar';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useSync } from '@/hooks/useSync';
export default function RootLayout() {
  // Drains the offline mutation queue on launch, on every foreground, and
  // on a background interval (Section 11 5.1) — mounted once at the root so
  // it runs regardless of which tab/screen is active. Every server route
  // now requires a signed-in account, so there's nothing to sync until
  // someone is actually logged in.
  const { session } = useAuthSession();
  useSync(Boolean(session));
  const [fontsLoaded] = useFonts({
    CormorantGaramond_600SemiBold,
    Lora_400Regular,
    Lora_600SemiBold,
  });
  if (!fontsLoaded) {
    return <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }
  return (
    <SafeAreaProvider>
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
      </Stack>
      <KeyboardDoneBar />
    </SafeAreaProvider>
  );
}
