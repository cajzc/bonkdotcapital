import 'react-native-get-random-values';
import { Stack } from 'expo-router';
import { AuthorizationProvider } from '../lib/AuthorizationProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Polyfill for structuredClone (required for Anchor)
if (typeof global.structuredClone === 'undefined') {
  const structuredClonePolyfill = require('@ungap/structured-clone');
  global.structuredClone = structuredClonePolyfill.default || structuredClonePolyfill;
}

// Polyfill for Buffer (required for Solana PDAs)
if (typeof global.Buffer === 'undefined') {
  const bufferPolyfill = require('buffer');
  global.Buffer = bufferPolyfill.Buffer;
  global.process = global.process || {};
  global.process.env = global.process.env || {};
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