import { Redirect } from 'expo-router';
// polyfill for buffer
import { Buffer } from 'buffer';
global.Buffer = Buffer;

export default function Index() {
  return <Redirect href="/(tabs)/feed" />;
} 