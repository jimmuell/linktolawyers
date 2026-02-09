import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ChatInput } from '@/components/ui/chat-input';
import { ImageViewer } from '@/components/ui/image-viewer';
import { MessageBubble } from '@/components/ui/message-bubble';
import type { AttachmentAction } from '@/components/ui/message-bubble';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { Colors } from '@/constants/theme';
import { Spacing } from '@/constants/typography';
import {
  useConversationMessages,
  useCreateConversation,
  useDeleteMessageAttachment,
  useMarkConversationRead,
  useSendMessage,
  useSendMessageWithAttachments,
} from '@/hooks/use-messages';
import { useRealtimeMessages, useTypingIndicator } from '@/hooks/use-realtime-messages';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePresenceStore } from '@/stores/presence-store';
import { useAuthStore } from '@/stores/auth-store';
import type { MessageAttachment, MessageWithSender, RequestStatus, StagedAttachment } from '@/types';

interface ChatPanelProps {
  conversationId: string | undefined;
  requestId: string;
  otherPartyId: string;
  otherPartyName: string;
  requestTitle: string;
  requestStatus: RequestStatus;
  variant: 'client' | 'attorney';
}

export function ChatPanel({
  conversationId: initialConversationId,
  requestId,
  otherPartyId,
  otherPartyName,
  requestTitle,
  requestStatus,
  variant,
}: ChatPanelProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const userId = useAuthStore((s) => s.user?.id);
  const flatListRef = useRef<FlatList>(null);
  const isOnline = usePresenceStore((s) => s.onlineUsers.has(otherPartyId));

  const [activeConversationId, setActiveConversationId] = useState(initialConversationId);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Sync if parent provides a new conversationId
  useEffect(() => {
    if (initialConversationId) {
      setActiveConversationId(initialConversationId);
    }
  }, [initialConversationId]);

  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useConversationMessages(activeConversationId);

  const sendMessage = useSendMessage();
  const sendWithAttachments = useSendMessageWithAttachments();
  const deleteAttachment = useDeleteMessageAttachment();
  const markRead = useMarkConversationRead();
  const createConversation = useCreateConversation();
  const { typingUser, sendTyping } = useTypingIndicator(activeConversationId);

  // Subscribe to realtime messages
  useRealtimeMessages(activeConversationId);

  // Mark conversation as read on mount and when new messages arrive
  useEffect(() => {
    if (activeConversationId) {
      markRead.mutate(activeConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, messagesData?.pages?.[0]?.[0]?.id]);

  const messages = useMemo(() => {
    if (!messagesData) return [];
    return messagesData.pages.flat();
  }, [messagesData]);

  const profile = useAuthStore((s) => s.profile);
  const senderName = profile?.full_name ?? 'Someone';
  const recipientRole = variant === 'client' ? 'attorney' : 'client';

  const handleSend = useCallback(
    async (text: string, attachments: StagedAttachment[]) => {
      let convoId = activeConversationId;

      // Lazy-create conversation on first send
      if (!convoId) {
        try {
          const conversation = await createConversation.mutateAsync({
            otherPartyId,
            requestId,
            role: variant,
          });
          convoId = conversation.id;
          setActiveConversationId(convoId);
        } catch {
          return;
        }
      }

      const pushParams = {
        recipientId: otherPartyId,
        senderName,
        requestId,
        requestStatus,
        recipientRole: recipientRole as 'client' | 'attorney',
      };

      if (attachments.length > 0) {
        sendWithAttachments.mutate({
          conversationId: convoId,
          content: text,
          attachments,
          ...pushParams,
        });
      } else {
        sendMessage.mutate({ conversationId: convoId, content: text, ...pushParams });
      }
    },
    [activeConversationId, createConversation, otherPartyId, requestId, requestStatus, variant, senderName, recipientRole, sendMessage, sendWithAttachments],
  );

  const handleDocumentPress = useCallback(async (attachment: MessageAttachment) => {
    try {
      if (Platform.OS === 'web') {
        window.open(attachment.file_url, '_blank');
        return;
      }
      const { openBrowserAsync } = await import('expo-web-browser');
      await openBrowserAsync(attachment.file_url);
    } catch {
      Alert.alert('Error', 'Could not open the document.');
    }
  }, []);

  const handleSaveImage = useCallback(async (attachment: MessageAttachment) => {
    try {
      if (Platform.OS === 'web') {
        window.open(attachment.file_url, '_blank');
        return;
      }
      const { downloadAsync, cacheDirectory } = await import('expo-file-system/legacy');
      const MediaLibrary = await import('expo-media-library');

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library access is required to save images.');
        return;
      }

      const localUri = `${cacheDirectory}${attachment.file_name}`;
      await downloadAsync(attachment.file_url, localUri);
      await MediaLibrary.saveToLibraryAsync(localUri);
      Alert.alert('Saved', 'Image saved to your photo library.');
    } catch {
      Alert.alert('Error', 'Could not save the image.');
    }
  }, []);

  const handleDownloadDocument = useCallback(async (attachment: MessageAttachment) => {
    try {
      if (Platform.OS === 'web') {
        window.open(attachment.file_url, '_blank');
        return;
      }
      const { downloadAsync, cacheDirectory } = await import('expo-file-system/legacy');
      const { shareAsync } = await import('expo-sharing');
      const localUri = `${cacheDirectory}${attachment.file_name}`;
      await downloadAsync(attachment.file_url, localUri);
      await shareAsync(localUri);
    } catch {
      Alert.alert('Error', 'Could not download the document.');
    }
  }, []);

  const handleDeleteAttachment = useCallback(
    (attachment: MessageAttachment) => {
      if (!activeConversationId) return;
      Alert.alert(
        'Delete Attachment',
        `Are you sure you want to delete "${attachment.file_name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteAttachment.mutate({
                attachmentId: attachment.id,
                conversationId: activeConversationId,
              });
            },
          },
        ],
      );
    },
    [activeConversationId, deleteAttachment],
  );

  const handleAttachmentAction = useCallback(
    (attachment: MessageAttachment, action: AttachmentAction) => {
      const isImage = attachment.file_type.startsWith('image/');
      switch (action) {
        case 'view':
          if (isImage) {
            setViewingImage(attachment.file_url);
          } else {
            handleDocumentPress(attachment);
          }
          break;
        case 'download':
          if (isImage) {
            handleSaveImage(attachment);
          } else {
            handleDownloadDocument(attachment);
          }
          break;
        case 'delete':
          handleDeleteAttachment(attachment);
          break;
      }
    },
    [handleDocumentPress, handleSaveImage, handleDownloadDocument, handleDeleteAttachment],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderMessage = useCallback(
    ({ item, index }: { item: MessageWithSender; index: number }) => {
      const nextMessage = messages[index + 1];
      const showTimestamp =
        !nextMessage ||
        new Date(item.created_at).getTime() - new Date(nextMessage.created_at).getTime() >
          5 * 60 * 1000;

      return (
        <MessageBubble
          message={item}
          isOwn={item.sender_id === userId}
          showTimestamp={showTimestamp}
          onImagePress={setViewingImage}
          onDocumentPress={handleDocumentPress}
          onAttachmentAction={handleAttachmentAction}
        />
      );
    },
    [userId, messages, handleDocumentPress, handleAttachmentAction],
  );

  const isSending =
    sendMessage.isPending ||
    sendWithAttachments.isPending ||
    createConversation.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      {/* Online status banner */}
      {isOnline && (
        <View style={[styles.onlineBanner, { backgroundColor: colors.surface }]}>
          <View style={styles.onlineDot} />
          <ThemedText style={[styles.onlineText, { color: colors.textSecondary }]}>
            {otherPartyName} is online
          </ThemedText>
        </View>
      )}

      {isLoading && activeConversationId ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            typingUser ? <TypingIndicator name={typingUser} /> : null
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                style={styles.loadingMore}
                size="small"
                color={colors.primary}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="chat-bubble-outline" size={40} color={colors.textTertiary} />
              <ThemedText style={[styles.emptyText, { color: colors.textTertiary }]}>
                {activeConversationId
                  ? 'No messages yet. Say hello!'
                  : `Start a conversation with ${otherPartyName}`}
              </ThemedText>
            </View>
          }
        />
      )}

      <ChatInput
        onSend={handleSend}
        onTyping={sendTyping}
        isSending={isSending}
      />

      <ImageViewer imageUrl={viewingImage} onClose={() => setViewingImage(null)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  onlineText: {
    fontSize: 12,
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  loadingMore: {
    paddingVertical: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing['3xl'],
    // In an inverted list, "empty" content appears at the bottom of the screen
    transform: [{ scaleY: -1 }],
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
