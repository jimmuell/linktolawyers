import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/typography';
import { useAuthStore } from '@/stores/auth-store';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">LinkToLawyers</ThemedText>
      <ThemedText>Find the right legal help, fast.</ThemedText>
      {user && (
        <ThemedText style={styles.email}>Signed in as {user.email}</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  email: {
    marginTop: Spacing.sm,
    opacity: 0.7,
  },
});
