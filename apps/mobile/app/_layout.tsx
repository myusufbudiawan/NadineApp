import '@/lib/webAlert';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond';
import { Lora_400Regular, Lora_600SemiBold, useFonts } from '@expo-google-fonts/lora';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/lib/design-system/tokens';
import { KeyboardDoneBar } from '@/components/ui/KeyboardDoneBar';
import { CelebrationHost } from '@/components/celebration/CelebrationHost';
import { ThemedScreen, ThemeProvider, useTheme } from '@/features/theme/ThemeProvider';
import { PhotoBlurProvider } from '@/features/privacy/PhotoBlurContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useSync } from '@/hooks/useSync';
import { OFFLINE_ONLY } from '@/lib/offlineOnly';

// The app is laid out for a phone. On the web demo the *content* narrows to a
// readable column (components/ui/Screen.tsx) while the tinted ground runs edge
// to edge, so a wide browser gets a designed page rather than a phone frame
// floating in an empty field.
export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { scheme } = useTheme();
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
  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  if (!fontsLoaded) {
    return <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PhotoBlurProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        {/* The navigation theme paints every Stack card and Tabs scene, so no
            default-white background shows through during transitions. */}
        <NavThemeProvider value={{ ...navTheme, colors: { ...navTheme.colors, background: colors.canvas } }}>
          <Stack
            screenOptions={{ headerShown: false, animation: 'fade' }}
            // (tabs) remounts its own screens instead, so the active tab survives a scheme change.
            screenLayout={({ route, children }) =>
              route.name === '(tabs)' ? children : <ThemedScreen>{children}</ThemedScreen>
            }
          />
        </NavThemeProvider>
        <KeyboardDoneBar />
        {/* Milestone celebrations play over the whole app, whatever screen is up. */}
        <CelebrationHost />
      </PhotoBlurProvider>
    </SafeAreaProvider>
  );
}
