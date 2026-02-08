import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/typography';
import { useAuthStore } from '@/stores/auth-store';

export default function AttorneyHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">
        Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
      </ThemedText>
      <ThemedText>Manage your practice and connect with clients.</ThemedText>
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
