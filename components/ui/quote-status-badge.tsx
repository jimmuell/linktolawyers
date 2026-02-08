import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { QuoteStatus } from '@/types';

const STATUS_CONFIG: Record<QuoteStatus, { label: string; colorKey: keyof typeof Colors.light }> = {
  draft: { label: 'Draft', colorKey: 'textSecondary' },
  submitted: { label: 'Submitted', colorKey: 'info' },
  viewed: { label: 'Viewed', colorKey: 'warning' },
  accepted: { label: 'Accepted', colorKey: 'success' },
  declined: { label: 'Declined', colorKey: 'error' },
  withdrawn: { label: 'Withdrawn', colorKey: 'textTertiary' },
  expired: { label: 'Expired', colorKey: 'textTertiary' },
};

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
}

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const theme = useColorScheme() ?? 'light';
  const config = STATUS_CONFIG[status];
  const color = Colors[theme][config.colorKey];

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <ThemedText style={[styles.text, { color }]}>{config.label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
