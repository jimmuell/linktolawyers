import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { StatusBadge } from '@/components/ui/status-badge';
import { PRACTICE_AREA_MAP } from '@/constants/practice-areas';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { US_STATE_MAP } from '@/constants/us-states';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMyQuoteForRequest, useRequestQuotes } from '@/hooks/use-quotes';
import { useCancelRequest, useDeleteAttachment, useDeleteDraft, useDeleteRequest, useRequest, useUploadAttachment } from '@/hooks/use-requests';
import { useAuthStore } from '@/stores/auth-store';
import type { RequestAttachment } from '@/types';

interface RequestDetailScreenProps {
  requestId: string;
  variant: 'client' | 'attorney';
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export function RequestDetailScreen({ requestId, variant, isSaved, onToggleSave }: RequestDetailScreenProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: request, isLoading, error } = useRequest(requestId);
  const cancelRequest = useCancelRequest();
  const deleteDraft = useDeleteDraft();
  const deleteAttachment = useDeleteAttachment();
  const deleteRequest = useDeleteRequest();
  const uploadAttachment = useUploadAttachment();
  const [uploadingType, setUploadingType] = useState<'image' | 'pdf' | null>(null);
  const { data: myQuote } = useMyQuoteForRequest(variant === 'attorney' ? requestId : undefined);
  const { data: requestQuotes } = useRequestQuotes(variant === 'client' ? requestId : undefined);
  const quoteCount = requestQuotes?.length ?? 0;

  const urgencyLabels: Record<string, string> = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };

  const openAttachment = async (att: RequestAttachment) => {
    if (Platform.OS === 'web') {
      Linking.openURL(att.file_url);
    } else {
      await WebBrowser.openBrowserAsync(att.file_url);
    }
  };

  const confirmDeleteAttachment = (att: RequestAttachment) => {
    Alert.alert('Delete Attachment', `Remove "${att.file_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteAttachment.mutate({ id: att.id, requestId }),
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ThemedText>Failed to load request.</ThemedText>
          <Pressable onPress={() => router.back()}>
            <ThemedText style={{ color: colors.textLink }}>Go back</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const location = [request.city, request.state ? US_STATE_MAP[request.state] || request.state : null]
    .filter(Boolean)
    .join(', ');

  const budgetDisplay =
    request.budget_min != null && request.budget_max != null
      ? `$${request.budget_min.toLocaleString()} – $${request.budget_max.toLocaleString()}`
      : request.budget_min != null
        ? `From $${request.budget_min.toLocaleString()}`
        : request.budget_max != null
          ? `Up to $${request.budget_max.toLocaleString()}`
          : null;

  const handleCancel = () => {
    Alert.alert('Cancel Request', 'Are you sure you want to cancel this request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await cancelRequest.mutateAsync(request.id);
          router.back();
        },
      },
    ]);
  };

  const handleDeleteDraft = () => {
    Alert.alert('Delete Draft', 'This draft will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDraft.mutateAsync(request.id);
          router.back();
        },
      },
    ]);
  };

  const handleDeleteRequest = () => {
    Alert.alert('Delete Request', 'This request will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRequest.mutateAsync(request.id);
          router.back();
        },
      },
    ]);
  };

  const canAddAttachments = request.status !== 'closed' && request.status !== 'cancelled';

  const handleAddImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploadingType('image');
      try {
        await uploadAttachment.mutateAsync({
          requestId,
          fileUri: asset.uri,
          fileName: asset.fileName ?? `image_${Date.now()}.jpg`,
          fileType: asset.mimeType ?? 'image/jpeg',
          fileSize: asset.fileSize ?? 0,
        });
      } catch (e) {
        Alert.alert('Upload Failed', e instanceof Error ? e.message : 'Could not upload image.');
      } finally {
        setUploadingType(null);
      }
    }
  };

  const handleAddPdf = async () => {
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setUploadingType('pdf');
        try {
          await uploadAttachment.mutateAsync({
            requestId,
            fileUri: asset.uri,
            fileName: asset.name,
            fileType: asset.mimeType ?? 'application/pdf',
            fileSize: asset.size ?? 0,
          });
        } finally {
          setUploadingType(null);
        }
      }
    } catch (e) {
      setUploadingType(null);
      Alert.alert('Upload Failed', e instanceof Error ? e.message : 'Could not upload PDF.');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Request Details</ThemedText>
        {variant === 'attorney' && onToggleSave ? (
          <Pressable onPress={onToggleSave} hitSlop={8}>
            <MaterialIcons
              name={isSaved ? 'bookmark' : 'bookmark-border'}
              size={24}
              color={isSaved ? colors.primary : colors.text}
            />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleRow}>
          <StatusBadge status={request.status} />
          <ThemedText style={styles.requestTitle}>{request.title}</ThemedText>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <DetailRow label="Practice Area" value={PRACTICE_AREA_MAP[request.practice_area] || request.practice_area} />
          {location && <DetailRow label="Location" value={location} />}
          {budgetDisplay && <DetailRow label="Budget" value={budgetDisplay} />}
          <DetailRow label="Urgency" value={urgencyLabels[request.urgency] ?? request.urgency} />
          <DetailRow
            label="Submitted"
            value={new Date(request.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            isLast
          />
        </View>

        <View style={styles.descriptionSection}>
          <ThemedText style={styles.sectionLabel}>Description</ThemedText>
          <ThemedText style={styles.descriptionText}>{request.description}</ThemedText>
        </View>

        {((request.request_attachments && request.request_attachments.length > 0) || canAddAttachments) && (
          <View style={styles.attachmentSection}>
            <ThemedText style={styles.sectionLabel}>
              Attachments{request.request_attachments?.length ? ` (${request.request_attachments.length})` : ''}
            </ThemedText>
            {request.request_attachments && request.request_attachments.length > 0 && (
              <View style={styles.attachList}>
                {request.request_attachments.map((att) => {
                  const isPdf = att.file_type === 'application/pdf' || att.file_name.endsWith('.pdf');
                  return (
                    <View key={att.id} style={[styles.attachItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Pressable style={styles.attachContent} onPress={() => openAttachment(att)}>
                        {isPdf ? (
                          <MaterialIcons name="picture-as-pdf" size={32} color={colors.error} />
                        ) : (
                          <Image source={{ uri: att.file_url }} style={styles.attachThumb} />
                        )}
                        <View style={styles.attachInfo}>
                          <ThemedText style={styles.attachName} numberOfLines={1}>{att.file_name}</ThemedText>
                          <ThemedText style={[styles.attachSize, { color: colors.textTertiary }]}>
                            {att.file_size < 1024 * 1024
                              ? `${(att.file_size / 1024).toFixed(0)} KB`
                              : `${(att.file_size / (1024 * 1024)).toFixed(1)} MB`}
                          </ThemedText>
                        </View>
                        <MaterialIcons name="open-in-new" size={18} color={colors.textTertiary} />
                      </Pressable>
                      {att.uploaded_by === userId && (
                        <Pressable
                          style={styles.attachDelete}
                          onPress={() => confirmDeleteAttachment(att)}
                          hitSlop={8}>
                          <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
            {canAddAttachments && (
              <View style={styles.addAttachRow}>
                <Pressable
                  style={[styles.addAttachButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={handleAddImage}
                  disabled={uploadingType !== null}>
                  {uploadingType === 'image' ? (
                    <ActivityIndicator size="small" color={colors.textTertiary} />
                  ) : (
                    <>
                      <MaterialIcons name="add-photo-alternate" size={22} color={colors.textTertiary} />
                      <ThemedText style={[styles.addAttachText, { color: colors.textSecondary }]}>Image</ThemedText>
                    </>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.addAttachButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={handleAddPdf}
                  disabled={uploadingType !== null}>
                  {uploadingType === 'pdf' ? (
                    <ActivityIndicator size="small" color={colors.textTertiary} />
                  ) : (
                    <>
                      <MaterialIcons name="picture-as-pdf" size={22} color={colors.textTertiary} />
                      <ThemedText style={[styles.addAttachText, { color: colors.textSecondary }]}>PDF</ThemedText>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        )}

        {variant === 'client' && (
          <View style={styles.actions}>
            {(request.status === 'pending' || request.status === 'quoted') && (
              <Pressable
                style={[styles.actionButton, { borderColor: colors.error }]}
                onPress={handleCancel}
                disabled={cancelRequest.isPending}>
                <ThemedText style={[styles.actionText, { color: colors.error }]}>
                  Cancel Request
                </ThemedText>
              </Pressable>
            )}
            {request.status === 'draft' && (
              <Pressable
                style={[styles.actionButton, { borderColor: colors.error }]}
                onPress={handleDeleteDraft}
                disabled={deleteDraft.isPending}>
                <ThemedText style={[styles.actionText, { color: colors.error }]}>
                  Delete Draft
                </ThemedText>
              </Pressable>
            )}
            {request.status === 'cancelled' && (
              <Pressable
                style={[styles.actionButton, { borderColor: colors.error }]}
                onPress={handleDeleteRequest}
                disabled={deleteRequest.isPending}>
                <ThemedText style={[styles.actionText, { color: colors.error }]}>
                  Delete Request
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}

        {variant === 'attorney' && (
          <View style={styles.actions}>
            {myQuote ? (
              <Pressable
                style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/(attorney)/quotes/${myQuote.id}`)}>
                <ThemedText style={[styles.primaryActionText, { color: colors.primaryForeground }]}>
                  View Your Quote
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/(attorney)/quotes/new?requestId=${requestId}`)}>
                <ThemedText style={[styles.primaryActionText, { color: colors.primaryForeground }]}>
                  Submit Quote
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}

        {variant === 'client' && (request?.status === 'quoted' || request?.status === 'accepted') && quoteCount > 0 && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/(client)/requests/${requestId}/quotes`)}>
              <ThemedText style={[styles.primaryActionText, { color: colors.primaryForeground }]}>
                View Quotes ({quoteCount})
              </ThemedText>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={[styles.detailRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]}>
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
  titleRow: {
    gap: Spacing.sm,
  },
  requestTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  section: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  detailRow: {
    padding: Spacing.lg,
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
  descriptionSection: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  attachmentSection: {
    gap: Spacing.md,
  },
  attachList: {
    gap: Spacing.sm,
  },
  attachItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  attachContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  attachThumb: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
  },
  attachInfo: {
    flex: 1,
    gap: 2,
  },
  attachName: {
    fontSize: 14,
    fontWeight: '500',
  },
  attachSize: {
    fontSize: 12,
  },
  attachDelete: {
    padding: Spacing.md,
  },
  addAttachRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  addAttachButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 44,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addAttachText: {
    fontSize: 14,
    fontWeight: '500',
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
});
