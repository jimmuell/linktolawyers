import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { formatFee } from '@/components/ui/quote-card';
import { PRACTICE_AREA_MAP } from '@/constants/practice-areas';
import { Colors } from '@/constants/theme';
import { Elevation, Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CaseWithDetails } from '@/types';

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

interface CaseCardProps {
  caseData: CaseWithDetails;
  onPress?: () => void;
}

export function CaseCard({ caseData, onPress }: CaseCardProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { request, quote, otherParty } = caseData;
  const isActive = request.status === 'accepted';

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Elevation.sm]}
      onPress={onPress}>
      <View style={styles.header}>
        <View
          style={[
            styles.statusBadge,
            { borderColor: isActive ? colors.success : colors.textTertiary },
          ]}>
          <ThemedText
            style={[
              styles.statusText,
              { color: isActive ? colors.success : colors.textTertiary },
            ]}>
            {isActive ? 'Active' : 'Closed'}
          </ThemedText>
        </View>
        <ThemedText style={[styles.timeAgo, { color: colors.textTertiary }]}>
          {formatTimeAgo(request.updated_at)}
        </ThemedText>
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
      </View>

      <View style={[styles.divider, { backgroundColor: colors.separator }]} />

      <View style={styles.partyRow}>
        {otherParty.avatar_url ? (
          <Image source={{ uri: otherParty.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="person" size={18} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.partyInfo}>
          <ThemedText style={styles.partyName} numberOfLines={1}>
            {otherParty.full_name ?? 'User'}
          </ThemedText>
          <ThemedText style={[styles.feeText, { color: colors.textSecondary }]}>
            {formatFee(quote.pricing_type, quote.fee_amount, quote.estimated_hours)}
          </ThemedText>
        </View>
      </View>
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
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.xs,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyInfo: {
    flex: 1,
    gap: 2,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
  },
  feeText: {
    fontSize: 13,
  },
});
