import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface EmptyStateProps {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={styles.container}>
      <MaterialIcons name={icon} size={48} color={colors.textTertiary} />
      <ThemedText style={styles.title}>{title}</ThemedText>
      {description && (
        <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </ThemedText>
      )}
      {actionLabel && onAction && (
        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onAction}>
          <ThemedText style={[styles.buttonText, { color: colors.primaryForeground }]}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
    gap: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
