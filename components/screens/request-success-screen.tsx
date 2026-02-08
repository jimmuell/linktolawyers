import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { RequestStatus } from '@/types';

interface RequestSuccessScreenProps {
  requestId: string;
  status: RequestStatus;
}

export function RequestSuccessScreen({ requestId, status }: RequestSuccessScreenProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();

  const isDraft = status === 'draft';
  const title = isDraft ? 'Draft Saved!' : 'Request Submitted!';
  const subtitle = isDraft
    ? 'Your request has been saved as a draft. You can edit and submit it anytime.'
    : 'Your request is now visible to attorneys. You will be notified when quotes arrive.';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.successBackground }]}>
          <MaterialIcons name="check-circle" size={64} color={colors.success} />
        </View>

        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </ThemedText>

        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace(`/(client)/requests/${requestId}`)}>
            <ThemedText style={[styles.buttonText, { color: colors.primaryForeground }]}>
              View Request
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => router.replace('/(client)/(tabs)/requests')}>
            <ThemedText style={styles.secondaryButtonText}>Back to Requests</ThemedText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  primaryButton: {
    height: 50,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 50,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
