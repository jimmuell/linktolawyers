import { Stack } from 'expo-router';

export default function AttorneyLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="browse/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="quotes/new"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="quotes/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="quotes/templates"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
