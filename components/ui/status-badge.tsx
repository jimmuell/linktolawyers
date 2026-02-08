import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { RequestStatus } from '@/types';

const STATUS_CONFIG: Record<RequestStatus, { label: string; colorKey: keyof typeof Colors.light }> = {
  draft: { label: 'Draft', colorKey: 'textSecondary' },
  pending: { label: 'Pending', colorKey: 'info' },
  quoted: { label: 'Quoted', colorKey: 'warning' },
  accepted: { label: 'Accepted', colorKey: 'success' },
  closed: { label: 'Closed', colorKey: 'textTertiary' },
  cancelled: { label: 'Cancelled', colorKey: 'error' },
};

interface StatusBadgeProps {
  status: RequestStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
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
