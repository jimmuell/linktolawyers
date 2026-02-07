import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/typography';
import { useAuthStore } from '@/stores/auth-store';

export default function HomeScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to sign out');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">LinkToLawyers</ThemedText>
      <ThemedText>Find the right legal help, fast.</ThemedText>
      {user && (
        <ThemedText style={styles.email}>Signed in as {user.email}</ThemedText>
      )}
      <View style={styles.logoutContainer}>
        <Button title="Sign Out" variant="outline" onPress={handleSignOut} />
      </View>
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
  logoutContainer: {
    marginTop: Spacing['2xl'],
  },
});
