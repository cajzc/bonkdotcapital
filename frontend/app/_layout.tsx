import 'react-native-get-random-values';
import { Stack } from 'expo-router';
import { AuthorizationProvider } from '../lib/AuthorizationProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Polyfill for structuredClone (required for Anchor)
if (typeof global.structuredClone === 'undefined') {
  const structuredClonePolyfill = require('@ungap/structured-clone');
  global.structuredClone = structuredClonePolyfill.default || structuredClonePolyfill;
}


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