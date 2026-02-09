import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ChatInput } from '@/components/ui/chat-input';
import { MessageBubble } from '@/components/ui/message-bubble';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { Colors } from '@/constants/theme';
import { Spacing } from '@/constants/typography';
import {
  useConversationMessages,
  useCreateConversation,
  useMarkConversationRead,
  useSendMessage,
} from '@/hooks/use-messages';
import { useRealtimeMessages, useTypingIndicator } from '@/hooks/use-realtime-messages';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import type { MessageWithSender } from '@/types';

interface ChatPanelProps {
  conversationId: string | undefined;
  requestId: string;
  otherPartyId: string;
  otherPartyName: string;
  requestTitle: string;
  variant: 'client' | 'attorney';
}

export function ChatPanel({
  conversationId: initialConversationId,
  requestId,
  otherPartyId,
  otherPartyName,
  requestTitle,
  variant,
}: ChatPanelProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const userId = useAuthStore((s) => s.user?.id);
  const flatListRef = useRef<FlatList>(null);

  const [activeConversationId, setActiveConversationId] = useState(initialConversationId);

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

  const handleSend = useCallback(
    async (text: string) => {
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

      sendMessage.mutate({ conversationId: convoId, content: text });
    },
    [activeConversationId, createConversation, otherPartyId, requestId, variant, sendMessage],
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
        />
      );
    },
    [userId, messages],
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
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
        isSending={sendMessage.isPending || createConversation.isPending}
      />
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
