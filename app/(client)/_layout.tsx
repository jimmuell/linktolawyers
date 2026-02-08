import { Stack } from 'expo-router';

export default function ClientLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="requests/new"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="requests/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="requests/success"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="quotes/[quoteId]"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
