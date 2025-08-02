import { Stack } from 'expo-router';
import { AuthorizationProvider } from '../lib/AuthorizationProvider';

export default function RootLayout() {
  return (
    <AuthorizationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="index" />
      </Stack>
    </AuthorizationProvider>
  );
} 