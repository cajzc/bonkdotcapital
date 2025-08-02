import 'react-native-get-random-values';
import { Stack } from 'expo-router';
import { AuthorizationProvider } from '../lib/AuthorizationProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthorizationProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="index" />
        </Stack>
      </AuthorizationProvider>
    </SafeAreaProvider>
  );
} 