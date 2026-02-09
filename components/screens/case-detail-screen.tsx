import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AttorneyProfileModal } from '@/components/ui/attorney-profile-modal';
import { ChatPanel } from '@/components/ui/chat-panel';
import { formatFee } from '@/components/ui/quote-card';
import { ReviewModal } from '@/components/ui/review-modal';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { PRACTICE_AREA_MAP } from '@/constants/practice-areas';
import { PRICING_TYPE_MAP } from '@/constants/pricing-types';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { US_STATE_MAP } from '@/constants/us-states';
import {
  type CaseNoteWithAuthor,
  useAddCaseNote,
  useCaseDetail,
  useCaseNotes,
  useArchiveCase,
  useCaseReview,
  useCloseCase,
  useDeleteArchivedCase,
  useSubmitReview,
  useUnarchiveCase,
} from '@/hooks/use-cases';
import { useConversationForRequest } from '@/hooks/use-messages';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';

interface CaseDetailScreenProps {
  requestId: string;
  variant: 'client' | 'attorney';
  initialTab?: 'details' | 'chat';
}

export function CaseDetailScreen({ requestId, variant, initialTab = 'details' }: CaseDetailScreenProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);

  const [activeTab, setActiveTab] = useState<'details' | 'chat'>(initialTab);

  const { data: caseData, isLoading: casesLoading } = useCaseDetail(requestId, variant);

  const { data: notes, isLoading: notesLoading } = useCaseNotes(requestId);
  const addNote = useAddCaseNote();
  const closeCase = useCloseCase();
  const archiveCase = useArchiveCase();
  const unarchiveCase = useUnarchiveCase();
  const deleteArchivedCase = useDeleteArchivedCase();
  const { data: review } = useCaseReview(requestId);
  const submitReview = useSubmitReview();

  const { data: conversation } = useConversationForRequest(requestId);

  const [noteText, setNoteText] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAttorneyProfile, setShowAttorneyProfile] = useState(false);

  const handleAddNote = useCallback(async () => {
    const text = noteText.trim();
    if (!text) return;
    setNoteText('');
    await addNote.mutateAsync({ requestId, content: text });
  }, [noteText, addNote, requestId]);

  const handleCloseCase = useCallback(() => {
    Alert.alert(
      'Close Case',
      'Are you sure you want to mark this case as closed? This indicates services are complete.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Case',
          style: 'destructive',
          onPress: async () => {
            await closeCase.mutateAsync(requestId);
            router.back();
          },
        },
      ],
    );
  }, [closeCase, requestId, router]);

  const handleArchiveCase = useCallback(() => {
    Alert.alert(
      'Archive Case',
      'Archive this case to remove it from your main list. You can view it later under the Archived filter.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            await archiveCase.mutateAsync(requestId);
            router.back();
          },
        },
      ],
    );
  }, [archiveCase, requestId, router]);

  const handleUnarchiveCase = useCallback(() => {
    Alert.alert(
      'Activate Case',
      'Move this case back to your main cases list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            await unarchiveCase.mutateAsync(requestId);
            router.back();
          },
        },
      ],
    );
  }, [unarchiveCase, requestId, router]);

  const handleDeleteCase = useCallback(() => {
    if (!caseData) return;
    Alert.alert(
      'Delete Case',
      'Permanently remove this case? This withdraws the accepted quote and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteArchivedCase.mutateAsync({
              requestId,
              quoteId: caseData.quote.id,
            });
            router.back();
          },
        },
      ],
    );
  }, [deleteArchivedCase, caseData, requestId, router]);

  const handleSubmitReview = useCallback(
    async (rating: number, comment: string | null) => {
      if (!caseData) return;
      await submitReview.mutateAsync({
        request_id: requestId,
        client_id: userId!,
        attorney_id: caseData.quote.attorney_id,
        rating,
        comment,
      });
      setShowReviewModal(false);
    },
    [caseData, submitReview, requestId, userId],
  );

  if (casesLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!caseData) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ThemedText>Case not found.</ThemedText>
          <Pressable onPress={() => router.back()}>
            <ThemedText style={{ color: colors.textLink }}>Go back</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { request, quote, otherParty, isArchived } = caseData;
  const isActive = request.status === 'accepted';
  const isClosed = request.status === 'closed';
  const pricingInfo = PRICING_TYPE_MAP[quote.pricing_type];
  const feeDisplay = formatFee(quote.pricing_type, quote.fee_amount, quote.estimated_hours);
  const location = [request.city, request.state ? US_STATE_MAP[request.state] || request.state : null]
    .filter(Boolean)
    .join(', ');

  const renderHeader = () => (
    <View style={styles.sections}>
      {/* Status */}
      <View style={styles.statusRow}>
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
      </View>

      {/* Other Party */}
      <Pressable
        style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={
          variant === 'client' ? () => setShowAttorneyProfile(true) : undefined
        }>
        <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {variant === 'client' ? 'Attorney' : 'Client'}
        </ThemedText>
        <View style={styles.partyRow}>
          {otherParty.avatar_url ? (
            <Image source={{ uri: otherParty.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.background }]}>
              <MaterialIcons name="person" size={20} color={colors.textTertiary} />
            </View>
          )}
          <ThemedText style={[styles.partyName, { flex: 1 }]}>
            {otherParty.full_name ?? 'User'}
          </ThemedText>
          {variant === 'client' && (
            <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
          )}
        </View>
      </Pressable>

      {/* Request Summary */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Request
        </ThemedText>
        <ThemedText style={styles.requestTitle}>{request.title}</ThemedText>
        <ThemedText style={[styles.requestMeta, { color: colors.textSecondary }]}>
          {PRACTICE_AREA_MAP[request.practice_area] || request.practice_area}
        </ThemedText>
        {location ? (
          <ThemedText style={[styles.requestMeta, { color: colors.textSecondary }]}>
            {location}
          </ThemedText>
        ) : null}
        <ThemedText style={styles.description} numberOfLines={4}>
          {request.description}
        </ThemedText>
      </View>

      {/* Accepted Quote Terms */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Accepted Terms
        </ThemedText>
        <DetailRow label="Pricing" value={pricingInfo?.label ?? quote.pricing_type} />
        <DetailRow label="Fee" value={feeDisplay} />
        {quote.scope_of_work && (
          <View style={styles.textBlock}>
            <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Scope
            </ThemedText>
            <ThemedText style={styles.bodyText} numberOfLines={3}>
              {quote.scope_of_work}
            </ThemedText>
          </View>
        )}
        {quote.estimated_timeline && (
          <DetailRow label="Timeline" value={quote.estimated_timeline} />
        )}
      </View>

      {/* Review display for closed case with existing review */}
      {variant === 'client' && isClosed && review && (
        <View style={[styles.section, { backgroundColor: colors.successBackground, borderColor: colors.success }]}>
          <ThemedText style={[styles.sectionLabel, { color: colors.success }]}>
            Your Review
          </ThemedText>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialIcons
                key={star}
                name={star <= review.rating ? 'star' : 'star-border'}
                size={24}
                color={colors.warning}
              />
            ))}
          </View>
          {review.comment && (
            <ThemedText style={styles.bodyText}>{review.comment}</ThemedText>
          )}
        </View>
      )}

      {/* Actions */}
      {variant === 'attorney' && isActive && (
        <Pressable
          style={[styles.actionButton, { borderColor: colors.error }]}
          onPress={handleCloseCase}
          disabled={closeCase.isPending}>
          {closeCase.isPending ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <ThemedText style={[styles.actionText, { color: colors.error }]}>
              Close Case
            </ThemedText>
          )}
        </Pressable>
      )}

      {variant === 'attorney' && isClosed && !isArchived && (
        <Pressable
          style={[styles.actionButton, { borderColor: colors.textTertiary }]}
          onPress={handleArchiveCase}
          disabled={archiveCase.isPending}>
          {archiveCase.isPending ? (
            <ActivityIndicator size="small" color={colors.textTertiary} />
          ) : (
            <ThemedText style={[styles.actionText, { color: colors.textSecondary }]}>
              Archive Case
            </ThemedText>
          )}
        </Pressable>
      )}

      {variant === 'attorney' && isArchived && (
        <>
          <Pressable
            style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
            onPress={handleUnarchiveCase}
            disabled={unarchiveCase.isPending}>
            {unarchiveCase.isPending ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <ThemedText style={[styles.primaryActionText, { color: colors.primaryForeground }]}>
                Activate
              </ThemedText>
            )}
          </Pressable>
          <Pressable
            style={[styles.actionButton, { borderColor: colors.error }]}
            onPress={handleDeleteCase}
            disabled={deleteArchivedCase.isPending}>
            {deleteArchivedCase.isPending ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <ThemedText style={[styles.actionText, { color: colors.error }]}>
                Delete
              </ThemedText>
            )}
          </Pressable>
        </>
      )}

      {variant === 'client' && isClosed && !review && (
        <Pressable
          style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowReviewModal(true)}>
          <ThemedText style={[styles.primaryActionText, { color: colors.primaryForeground }]}>
            Leave a Review
          </ThemedText>
        </Pressable>
      )}

      {/* Notes header */}
      <View style={styles.notesHeader}>
        <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Case Notes
        </ThemedText>
        <ThemedText style={[styles.noteCount, { color: colors.textTertiary }]}>
          {notes?.length ?? 0}
        </ThemedText>
      </View>
    </View>
  );

  const renderNote = ({ item }: { item: CaseNoteWithAuthor }) => {
    return (
      <View style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.noteHeader}>
          <ThemedText style={styles.noteAuthor}>
            {item.profiles?.full_name ?? 'User'}
          </ThemedText>
          <ThemedText style={[styles.noteTime, { color: colors.textTertiary }]}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </ThemedText>
        </View>
        <ThemedText style={styles.noteContent}>{item.content}</ThemedText>
      </View>
    );
  };

  const handleTabSelect = (index: number) => {
    setActiveTab(index === 0 ? 'details' : 'chat');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Case Details</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.segmentedControlContainer}>
        <SegmentedControl
          segments={['Details', 'Chat']}
          selectedIndex={activeTab === 'details' ? 0 : 1}
          onSelect={handleTabSelect}
        />
      </View>

      {activeTab === 'details' ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}>
          <FlatList
            data={notes ?? []}
            keyExtractor={(item) => item.id}
            renderItem={renderNote}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              notesLoading ? (
                <ActivityIndicator style={styles.notesLoading} color={colors.primary} />
              ) : (
                <ThemedText style={[styles.emptyNotes, { color: colors.textTertiary }]}>
                  No notes yet. Add the first update.
                </ThemedText>
              )
            }
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          />

          {(isActive || isClosed) && (
            <View style={[styles.inputBar, { borderTopColor: colors.separator, backgroundColor: colors.background }]}>
              <TextInput
                style={[
                  styles.noteInput,
                  {
                    borderColor: colors.inputBorder,
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                  },
                ]}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Add a note..."
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                maxLength={1000}
              />
              <Pressable
                style={[styles.sendButton, { backgroundColor: noteText.trim() ? colors.primary : colors.surface }]}
                onPress={handleAddNote}
                disabled={!noteText.trim() || addNote.isPending}>
                {addNote.isPending ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <MaterialIcons
                    name="send"
                    size={20}
                    color={noteText.trim() ? colors.primaryForeground : colors.textTertiary}
                  />
                )}
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      ) : (
        <ChatPanel
          conversationId={conversation?.id}
          requestId={requestId}
          otherPartyId={otherParty.id}
          otherPartyName={otherParty.full_name ?? 'User'}
          requestTitle={request.title}
          variant={variant}
        />
      )}

      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        isSubmitting={submitReview.isPending}
      />

      {variant === 'client' && (
        <AttorneyProfileModal
          visible={showAttorneyProfile}
          attorneyId={otherParty.id}
          onClose={() => setShowAttorneyProfile(false)}
        />
      )}
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
  flex: {
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
  segmentedControlContainer: {
    paddingVertical: Spacing.sm,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sections: {
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
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
  partyRow: {
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
  partyName: {
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
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.xs,
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
  textBlock: {
    gap: Spacing.xs,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
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
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  noteCount: {
    fontSize: 12,
  },
  noteCard: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteAuthor: {
    fontSize: 13,
    fontWeight: '600',
  },
  noteTime: {
    fontSize: 11,
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  notesLoading: {
    marginTop: Spacing.lg,
  },
  emptyNotes: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: Spacing.lg,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  noteInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
