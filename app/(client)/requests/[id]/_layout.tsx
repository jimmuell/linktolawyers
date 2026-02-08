import { Stack } from 'expo-router';

export default function RequestDetailLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="quotes" options={{ headerShown: false }} />
      <Stack.Screen
        name="edit"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen name="compare" options={{ headerShown: false }} />
    </Stack>
  );
}
