import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ProfileButton } from '@/components/ui/profile-button';
import { Colors } from '@/constants/theme';
import { Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function MessagesScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Math.max(Constants.statusBarHeight, 50) }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <ThemedText style={styles.title}>Messages</ThemedText>
        <ProfileButton />
      </View>

      <View style={styles.emptyState}>
        <MaterialIcons name="forum" size={48} color={colors.textTertiary} />
        <ThemedText style={[styles.emptyTitle, { color: colors.textSecondary }]}>
          No messages yet
        </ThemedText>
        <ThemedText style={[styles.emptyDescription, { color: colors.textTertiary }]}>
          Messages from attorneys will appear here.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    paddingTop: Spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
});
