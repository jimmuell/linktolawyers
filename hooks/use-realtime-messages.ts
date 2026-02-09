import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import type { MessageWithSender } from '@/types';

import { messageKeys } from './use-messages';

// ─── Realtime messages subscription ─────────────────────────────

export function useRealtimeMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as MessageWithSender;

          // Don't add own messages (already handled by optimistic update)
          if (newMessage.sender_id === userId) return;

          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          const messageWithSender: MessageWithSender = {
            ...newMessage,
            profiles: profile as { full_name: string | null; avatar_url: string | null } | null,
          };

          // Prepend to cache
          queryClient.setQueryData(
            messageKeys.conversationMessages(conversationId),
            (old: { pages: MessageWithSender[][]; pageParams: (string | null)[] } | undefined) => {
              if (!old) return old;
              const newPages = [...old.pages];
              newPages[0] = [messageWithSender, ...(newPages[0] ?? [])];
              return { ...old, pages: newPages };
            },
          );

          // Refresh conversations list and unread count
          queryClient.invalidateQueries({ queryKey: messageKeys.conversations(userId) });
          queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount(userId) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, queryClient]);
}

// ─── Typing indicator (Realtime Broadcast) ──────────────────────

export function useTypingIndicator(conversationId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id);
  const userName = useAuthStore((s) => s.profile?.full_name);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const channelRef = useRef<ReturnType<typeof supabase.channel>>(undefined);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const data = payload.payload as { userId: string; name: string };
        if (data.userId === userId) return;

        setTypingUser(data.name || 'Someone');

        // Clear after 3 seconds
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingUser(null), 3000);
      })
      .subscribe();

    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  const sendTyping = useCallback(() => {
    if (!channelRef.current || !userId) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, name: userName ?? 'User' },
    });
  }, [userId, userName]);

  return { typingUser, sendTyping };
}
