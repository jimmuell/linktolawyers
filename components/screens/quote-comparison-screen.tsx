import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { formatFee } from '@/components/ui/quote-card';
import { QuoteStatusBadge } from '@/components/ui/quote-status-badge';
import { PRICING_TYPE_MAP } from '@/constants/pricing-types';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRequestQuotes } from '@/hooks/use-quotes';
import type { QuoteWithAttorney } from '@/types';

interface QuoteComparisonScreenProps {
  requestId: string;
}

const ROW_LABELS = [
  'Attorney',
  'Status',
  'Pricing Type',
  'Fee',
  'Est. Hours',
  'Timeline',
  'Valid Until',
] as const;

function getRowValue(quote: QuoteWithAttorney, row: string): string {
  switch (row) {
    case 'Attorney':
      return quote.profiles?.full_name ?? 'Attorney';
    case 'Status':
      return '';
    case 'Pricing Type':
      return PRICING_TYPE_MAP[quote.pricing_type]?.label ?? quote.pricing_type;
    case 'Fee':
      return formatFee(quote.pricing_type, quote.fee_amount, quote.estimated_hours);
    case 'Est. Hours':
      return quote.estimated_hours ? `${quote.estimated_hours} hrs` : '-';
    case 'Timeline':
      return quote.estimated_timeline ?? '-';
    case 'Valid Until':
      return new Date(quote.valid_until).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    default:
      return '-';
  }
}

export function QuoteComparisonScreen({ requestId }: QuoteComparisonScreenProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const { data: quotes, isLoading } = useRequestQuotes(requestId);

  if (isLoading || !quotes) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const COLUMN_WIDTH = 160;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Compare Quotes</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} bounces={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator bounces={false}>
          <View>
            {/* Header row with attorney names */}
            <View style={styles.tableRow}>
              <View style={[styles.labelCell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ThemedText style={[styles.labelText, { color: colors.textSecondary }]}>
                  Field
                </ThemedText>
              </View>
              {quotes.map((quote) => (
                <View
                  key={quote.id}
                  style={[styles.valueCell, { width: COLUMN_WIDTH, backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ThemedText style={styles.columnHeader} numberOfLines={1}>
                    {quote.profiles?.full_name ?? 'Attorney'}
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* Data rows */}
            {ROW_LABELS.map((row, index) => (
              <View key={row} style={styles.tableRow}>
                <View
                  style={[
                    styles.labelCell,
                    {
                      backgroundColor: index % 2 === 0 ? colors.surface : colors.background,
                      borderColor: colors.border,
                    },
                  ]}>
                  <ThemedText style={[styles.labelText, { color: colors.textSecondary }]}>
                    {row}
                  </ThemedText>
                </View>
                {quotes.map((quote) => (
                  <View
                    key={quote.id}
                    style={[
                      styles.valueCell,
                      {
                        width: COLUMN_WIDTH,
                        backgroundColor: index % 2 === 0 ? colors.surface : colors.background,
                        borderColor: colors.border,
                      },
                    ]}>
                    {row === 'Status' ? (
                      <QuoteStatusBadge status={quote.status} />
                    ) : (
                      <ThemedText style={styles.valueText} numberOfLines={2}>
                        {getRowValue(quote, row)}
                      </ThemedText>
                    )}
                  </View>
                ))}
              </View>
            ))}

            {/* View Details row */}
            <View style={styles.tableRow}>
              <View style={[styles.labelCell, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <ThemedText style={[styles.labelText, { color: colors.textSecondary }]} />
              </View>
              {quotes.map((quote) => (
                <View
                  key={quote.id}
                  style={[styles.valueCell, { width: COLUMN_WIDTH, backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Pressable
                    style={[styles.detailButton, { borderColor: colors.primary }]}
                    onPress={() => router.push(`/(client)/quotes/${quote.id}?requestId=${requestId}`)}>
                    <ThemedText style={[styles.detailButtonText, { color: colors.primary }]}>
                      View Details
                    </ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
  },
  labelCell: {
    width: 110,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  valueCell: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  columnHeader: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  valueText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  detailButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  detailButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
