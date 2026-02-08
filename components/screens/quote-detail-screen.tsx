import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AttorneyProfileModal } from '@/components/ui/attorney-profile-modal';
import { formatFee } from '@/components/ui/quote-card';
import { QuoteStatusBadge } from '@/components/ui/quote-status-badge';
import { PRICING_TYPE_MAP } from '@/constants/pricing-types';
import { PRACTICE_AREA_MAP } from '@/constants/practice-areas';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  useAcceptQuote,
  useDeclineQuote,
  useMarkQuoteViewed,
  useQuote,
  useWithdrawQuote,
} from '@/hooks/use-quotes';

interface QuoteDetailScreenProps {
  quoteId: string;
  variant: 'client' | 'attorney';
}

export function QuoteDetailScreen({ quoteId, variant }: QuoteDetailScreenProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const { data: quote, isLoading, error } = useQuote(quoteId);
  const withdrawQuote = useWithdrawQuote();
  const acceptQuote = useAcceptQuote();
  const declineQuote = useDeclineQuote();
  const markViewed = useMarkQuoteViewed();
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showAttorneyProfile, setShowAttorneyProfile] = useState(false);

  // Mark as viewed on mount (client variant)
  useEffect(() => {
    if (variant === 'client' && quote && quote.status === 'submitted') {
      markViewed.mutate(quote.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, quote?.id, quote?.status]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !quote) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ThemedText>Failed to load quote.</ThemedText>
          <Pressable onPress={() => router.back()}>
            <ThemedText style={{ color: colors.textLink }}>Go back</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const pricingInfo = PRICING_TYPE_MAP[quote.pricing_type];
  const feeDisplay = formatFee(quote.pricing_type, quote.fee_amount, quote.estimated_hours);
  const validUntilDate = new Date(quote.valid_until);
  const isExpired = validUntilDate < new Date();
  const quoteAny = quote as unknown as Record<string, unknown>;
  const requestData = 'requests' in quote ? quoteAny.requests as {
    title: string;
    practice_area: string;
    status: string;
    description?: string;
    state?: string | null;
    city?: string | null;
    budget_min?: number | null;
    budget_max?: number | null;
    urgency?: string;
    created_at?: string;
  } | null : null;
  const attorneyData = 'profiles' in quote ? quoteAny.profiles as {
    full_name: string | null;
    avatar_url: string | null;
  } | null : null;

  const canEdit = variant === 'attorney' && (quote.status === 'submitted' || quote.status === 'viewed');
  const canWithdraw = variant === 'attorney' && (quote.status === 'submitted' || quote.status === 'viewed');
  const canAccept = variant === 'client' && (quote.status === 'submitted' || quote.status === 'viewed') && !isExpired;
  const canDecline = variant === 'client' && (quote.status === 'submitted' || quote.status === 'viewed');

  const handleWithdraw = () => {
    Alert.alert('Withdraw Quote', 'Are you sure you want to withdraw this quote?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          await withdrawQuote.mutateAsync(quote.id);
          router.back();
        },
      },
    ]);
  };

  const handleAccept = () => {
    Alert.alert(
      'Accept Quote',
      'Accepting this quote will decline all other quotes for this request. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            await acceptQuote.mutateAsync(quote.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleDecline = async () => {
    if (!showDeclineReason) {
      setShowDeclineReason(true);
      return;
    }
    await declineQuote.mutateAsync({ id: quote.id, reason: declineReason || undefined });
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Quote Details</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusRow}>
          <QuoteStatusBadge status={quote.status} />
          {isExpired && quote.status !== 'accepted' && quote.status !== 'declined' && quote.status !== 'withdrawn' && (
            <ThemedText style={[styles.expiredText, { color: colors.error }]}>Expired</ThemedText>
          )}
        </View>

        {/* Attorney info (client variant) */}
        {variant === 'client' && attorneyData && (
          <Pressable
            style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowAttorneyProfile(true)}>
            <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>Attorney</ThemedText>
            <View style={styles.attorneyRow}>
              <View style={[styles.avatar, { backgroundColor: colors.background }]}>
                <MaterialIcons name="person" size={20} color={colors.textTertiary} />
              </View>
              <ThemedText style={[styles.attorneyName, { flex: 1 }]}>{attorneyData.full_name ?? 'Attorney'}</ThemedText>
              <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
            </View>
          </Pressable>
        )}

        {/* Request summary */}
        {requestData && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>Request</ThemedText>
            <ThemedText style={styles.requestTitle}>{requestData.title}</ThemedText>
            <ThemedText style={[styles.requestMeta, { color: colors.textSecondary }]}>
              {PRACTICE_AREA_MAP[requestData.practice_area] || requestData.practice_area}
            </ThemedText>
          </View>
        )}

        {/* Pricing */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>Pricing</ThemedText>
          <DetailRow label="Type" value={pricingInfo?.label ?? quote.pricing_type} />
          <DetailRow label="Fee" value={feeDisplay} />
          {quote.estimated_hours && (
            <DetailRow label="Estimated Hours" value={`${quote.estimated_hours} hrs`} />
          )}
        </View>

        {/* Scope */}
        <View style={styles.textSection}>
          <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>Scope of Work</ThemedText>
          <ThemedText style={styles.bodyText}>{quote.scope_of_work}</ThemedText>
        </View>

        {/* Timeline */}
        {quote.estimated_timeline && (
          <View style={styles.textSection}>
            <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>Estimated Timeline</ThemedText>
            <ThemedText style={styles.bodyText}>{quote.estimated_timeline}</ThemedText>
          </View>
        )}

        {/* Terms */}
        {quote.terms && (
          <View style={styles.textSection}>
            <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>Terms & Conditions</ThemedText>
            <ThemedText style={styles.bodyText}>{quote.terms}</ThemedText>
          </View>
        )}

        {/* Validity */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <DetailRow
            label="Valid Until"
            value={validUntilDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          />
          <DetailRow
            label="Submitted"
            value={new Date(quote.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          />
          {quote.viewed_at && (
            <DetailRow
              label="Viewed"
              value={new Date(quote.viewed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            />
          )}
        </View>

        {/* Decline Reason */}
        {quote.decline_reason && (
          <View style={[styles.section, { backgroundColor: colors.errorBackground, borderColor: colors.error }]}>
            <ThemedText style={[styles.sectionLabel, { color: colors.error }]}>Decline Reason</ThemedText>
            <ThemedText style={styles.bodyText}>{quote.decline_reason}</ThemedText>
          </View>
        )}

        {/* Attorney Actions */}
        {variant === 'attorney' && (canEdit || canWithdraw) && (
          <View style={styles.actions}>
            {canEdit && (
              <Pressable
                style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/(attorney)/quotes/${quote.id}/edit`)}>
                <ThemedText style={[styles.primaryActionText, { color: colors.primaryForeground }]}>
                  Edit Quote
                </ThemedText>
              </Pressable>
            )}
            {canWithdraw && (
              <Pressable
                style={[styles.actionButton, { borderColor: colors.error }]}
                onPress={handleWithdraw}
                disabled={withdrawQuote.isPending}>
                <ThemedText style={[styles.actionText, { color: colors.error }]}>
                  Withdraw Quote
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}

        {/* Client Actions */}
        {variant === 'client' && (canAccept || canDecline) && (
          <View style={styles.actions}>
            {canAccept && (
              <Pressable
                style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
                onPress={handleAccept}
                disabled={acceptQuote.isPending}>
                {acceptQuote.isPending ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <ThemedText style={[styles.primaryActionText, { color: colors.primaryForeground }]}>
                    Accept Quote
                  </ThemedText>
                )}
              </Pressable>
            )}
            {canDecline && (
              <>
                {showDeclineReason && (
                  <TextInput
                    style={[
                      styles.declineInput,
                      {
                        borderColor: colors.inputBorder,
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                      },
                    ]}
                    value={declineReason}
                    onChangeText={setDeclineReason}
                    placeholder="Reason for declining (optional)"
                    placeholderTextColor={colors.inputPlaceholder}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                )}
                <Pressable
                  style={[styles.actionButton, { borderColor: colors.error }]}
                  onPress={handleDecline}
                  disabled={declineQuote.isPending}>
                  {declineQuote.isPending ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <ThemedText style={[styles.actionText, { color: colors.error }]}>
                      {showDeclineReason ? 'Confirm Decline' : 'Decline Quote'}
                    </ThemedText>
                  )}
                </Pressable>
              </>
            )}
          </View>
        )}
      </ScrollView>

      <AttorneyProfileModal
        visible={showAttorneyProfile}
        attorneyId={quote.attorney_id}
        onClose={() => setShowAttorneyProfile(false)}
      />
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={styles.detailRow}>
      <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</ThemedText>
      <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
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
    gap: Spacing.md,
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
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  expiredText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attorneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attorneyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestMeta: {
    fontSize: 13,
  },
  textSection: {
    gap: Spacing.sm,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  actionButton: {
    height: 48,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryActionButton: {
    height: 50,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  declineInput: {
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 80,
  },
});
