import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
export default function RootLayout() {
  return (
    <>
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
          name="track/history/[type]"
          options={{ presentation: 'card' }}
        />
      </Stack>
    </>
  );
}
