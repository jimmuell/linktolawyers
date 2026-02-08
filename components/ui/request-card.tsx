import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { StatusBadge } from '@/components/ui/status-badge';
import { PRACTICE_AREA_MAP } from '@/constants/practice-areas';
import { Colors } from '@/constants/theme';
import { Elevation, Radii, Spacing } from '@/constants/typography';
import { US_STATE_MAP } from '@/constants/us-states';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Request, RequestWithClient } from '@/types';

function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString();
}

function formatBudget(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  if (min != null) return `From $${min.toLocaleString()}`;
  return `Up to $${max!.toLocaleString()}`;
}

interface RequestCardProps {
  request: Request | RequestWithClient;
  variant: 'client' | 'attorney';
  onPress?: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export function RequestCard({ request, variant, onPress, isSaved, onToggleSave }: RequestCardProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const budget = formatBudget(request.budget_min, request.budget_max);
  const location = [request.city, request.state ? US_STATE_MAP[request.state] || request.state : null]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Elevation.sm]}
      onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <StatusBadge status={request.status} />
          <ThemedText style={[styles.timeAgo, { color: colors.textTertiary }]}>
            {formatTimeAgo(request.created_at)}
          </ThemedText>
        </View>
        {variant === 'attorney' && onToggleSave && (
          <Pressable onPress={onToggleSave} hitSlop={8}>
            <MaterialIcons
              name={isSaved ? 'bookmark' : 'bookmark-border'}
              size={24}
              color={isSaved ? colors.primary : colors.textTertiary}
            />
          </Pressable>
        )}
      </View>

      <ThemedText style={styles.title} numberOfLines={2}>
        {request.title}
      </ThemedText>

      <View style={styles.meta}>
        <View style={[styles.chip, { backgroundColor: colors.surface }]}>
          <MaterialIcons name="gavel" size={14} color={colors.textSecondary} />
          <ThemedText style={[styles.chipText, { color: colors.textSecondary }]}>
            {PRACTICE_AREA_MAP[request.practice_area] || request.practice_area}
          </ThemedText>
        </View>

        {location ? (
          <View style={[styles.chip, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="location-on" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.chipText, { color: colors.textSecondary }]}>
              {location}
            </ThemedText>
          </View>
        ) : null}
      </View>

      {budget && (
        <ThemedText style={[styles.budget, { color: colors.text }]}>{budget}</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeAgo: {
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  budget: {
    fontSize: 14,
    fontWeight: '600',
  },
});
