import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { QuoteStatusBadge } from '@/components/ui/quote-status-badge';
import { PRICING_TYPE_MAP } from '@/constants/pricing-types';
import { PRACTICE_AREA_MAP } from '@/constants/practice-areas';
import { Colors } from '@/constants/theme';
import { Elevation, Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { PricingType, QuoteWithAttorney, QuoteWithRequest } from '@/types';

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

export function formatFee(pricingType: PricingType, feeAmount: number, estimatedHours?: number | null): string {
  switch (pricingType) {
    case 'flat_fee':
      return `$${feeAmount.toLocaleString()}`;
    case 'hourly':
      return estimatedHours
        ? `$${feeAmount.toLocaleString()}/hr (est. ${estimatedHours}hrs)`
        : `$${feeAmount.toLocaleString()}/hr`;
    case 'retainer':
      return `$${feeAmount.toLocaleString()}/mo`;
    case 'contingency':
      return `${feeAmount}%`;
    default:
      return `$${feeAmount.toLocaleString()}`;
  }
}

interface QuoteCardProps {
  quote: QuoteWithAttorney | QuoteWithRequest;
  variant: 'client' | 'attorney';
  onPress?: () => void;
}

export function QuoteCard({ quote, variant, onPress }: QuoteCardProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const pricingInfo = PRICING_TYPE_MAP[quote.pricing_type];
  const feeDisplay = formatFee(quote.pricing_type, quote.fee_amount, quote.estimated_hours);

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Elevation.sm]}
      onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <QuoteStatusBadge status={quote.status} />
          <ThemedText style={[styles.timeAgo, { color: colors.textTertiary }]}>
            {formatTimeAgo(quote.created_at)}
          </ThemedText>
        </View>
      </View>

      {variant === 'attorney' && 'requests' in quote && quote.requests && (
        <View style={styles.titleRow}>
          <ThemedText style={styles.title} numberOfLines={2}>
            {quote.requests.title}
          </ThemedText>
          <View style={[styles.chip, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="gavel" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.chipText, { color: colors.textSecondary }]}>
              {PRACTICE_AREA_MAP[quote.requests.practice_area] || quote.requests.practice_area}
            </ThemedText>
          </View>
        </View>
      )}

      {variant === 'client' && 'profiles' in quote && quote.profiles && (
        <View style={styles.titleRow}>
          <View style={styles.attorneyRow}>
            <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="person" size={18} color={colors.textTertiary} />
            </View>
            <ThemedText style={styles.title} numberOfLines={1}>
              {quote.profiles.full_name ?? 'Attorney'}
            </ThemedText>
          </View>
        </View>
      )}

      <View style={styles.pricingRow}>
        <View style={styles.pricingInfo}>
          <ThemedText style={[styles.pricingLabel, { color: colors.textSecondary }]}>
            {pricingInfo?.label}
          </ThemedText>
          <ThemedText style={styles.feeAmount}>{feeDisplay}</ThemedText>
        </View>
        {quote.estimated_timeline && (
          <View style={styles.pricingInfo}>
            <ThemedText style={[styles.pricingLabel, { color: colors.textSecondary }]}>
              Timeline
            </ThemedText>
            <ThemedText style={styles.timelineText} numberOfLines={1}>
              {quote.estimated_timeline}
            </ThemedText>
          </View>
        )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeAgo: {
    fontSize: 12,
  },
  titleRow: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  attorneyRow: {
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
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.xs,
  },
  pricingInfo: {
    gap: 2,
  },
  pricingLabel: {
    fontSize: 12,
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  timelineText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
