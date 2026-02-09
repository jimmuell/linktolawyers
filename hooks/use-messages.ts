import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useUnreadStore } from '@/stores/unread-store';
import type {
  Conversation,
  ConversationReadCursor,
  ConversationWithDetails,
  Message,
  MessageWithSender,
  Profile,
  RequestStatus,
} from '@/types';

const PAGE_SIZE = 50;

export const messageKeys = {
  all: ['messages'] as const,
  conversations: (userId: string) => [...messageKeys.all, 'conversations', userId] as const,
  conversationMessages: (conversationId: string) =>
    [...messageKeys.all, 'conversationMessages', conversationId] as const,
  unreadCount: (userId: string) => [...messageKeys.all, 'unreadCount', userId] as const,
  findConversation: (userId: string, otherPartyId: string, requestId?: string) =>
    [...messageKeys.all, 'find', userId, otherPartyId, requestId] as const,
  conversationForRequest: (userId: string, requestId: string) =>
    [...messageKeys.all, 'forRequest', userId, requestId] as const,
};

// ─── Conversations list ─────────────────────────────────────────

export function useConversations() {
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.profile?.role);

  return useQuery({
    queryKey: messageKeys.conversations(userId ?? ''),
    queryFn: async (): Promise<ConversationWithDetails[]> => {
      // Fetch conversations where user is a participant
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`client_id.eq.${userId},attorney_id.eq.${userId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      if (!conversations || conversations.length === 0) return [];

      const convos = conversations as unknown as Conversation[];

      // Get other party IDs
      const otherPartyIds = convos.map((c) =>
        c.client_id === userId ? c.attorney_id : c.client_id,
      );
      const uniqueIds = [...new Set(otherPartyIds)];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', uniqueIds);

      const profileMap = new Map<string, Pick<Profile, 'id' | 'full_name' | 'avatar_url'>>();
      for (const p of (profiles ?? []) as Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]) {
        profileMap.set(p.id, p);
      }

      // Fetch read cursors
      const convoIds = convos.map((c) => c.id);
      const { data: cursors } = await supabase
        .from('conversation_read_cursors')
        .select('*')
        .eq('user_id', userId!)
        .in('conversation_id', convoIds);

      const cursorMap = new Map<string, string>();
      for (const c of (cursors ?? []) as ConversationReadCursor[]) {
        cursorMap.set(c.conversation_id, c.last_read_at);
      }

      // Fetch unread counts per conversation
      const result: ConversationWithDetails[] = [];
      for (const convo of convos) {
        const otherPartyId = convo.client_id === userId ? convo.attorney_id : convo.client_id;
        const lastRead = cursorMap.get(convo.id);

        let unreadCount = 0;
        if (lastRead) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .neq('sender_id', userId!)
            .gt('created_at', lastRead);
          unreadCount = count ?? 0;
        } else if (convo.last_message_at) {
          // Never opened — all messages from other party are unread
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .neq('sender_id', userId!);
          unreadCount = count ?? 0;
        }

        // Fetch request title and status if linked
        let requestTitle: string | null = null;
        let requestStatus: RequestStatus | null = null;
        if (convo.request_id) {
          const { data: req } = await supabase
            .from('requests')
            .select('title, status')
            .eq('id', convo.request_id)
            .single();
          const reqData = req as { title: string; status: RequestStatus } | null;
          requestTitle = reqData?.title ?? null;
          requestStatus = reqData?.status ?? null;
        }

        result.push({
          ...convo,
          otherParty: profileMap.get(otherPartyId) ?? {
            id: otherPartyId,
            full_name: null,
            avatar_url: null,
          },
          unreadCount,
          requestTitle,
          requestStatus,
        });
      }

      return result;
    },
    enabled: !!userId && !!role,
  });
}

// ─── Conversation messages (paginated) ──────────────────────────

export function useConversationMessages(conversationId: string | undefined) {
  return useInfiniteQuery({
    queryKey: messageKeys.conversationMessages(conversationId ?? ''),
    queryFn: async ({ pageParam }): Promise<MessageWithSender[]> => {
      let query = supabase
        .from('messages')
        .select('*, profiles!sender_id(full_name, avatar_url)' as '*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (pageParam) {
        query = query.lt('created_at', pageParam as string);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as MessageWithSender[];
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return lastPage[lastPage.length - 1]?.created_at ?? undefined;
    },
    enabled: !!conversationId,
  });
}

// ─── Send message ───────────────────────────────────────────────

export function useSendMessage() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId!,
          content,
        } as never)
        .select('*, profiles!sender_id(full_name, avatar_url)' as '*')
        .single();

      if (error) throw error;
      return data as unknown as MessageWithSender;
    },
    onSuccess: (data) => {
      // Optimistic: prepend message to the cache
      queryClient.setQueryData(
        messageKeys.conversationMessages(data.conversation_id),
        (old: { pages: MessageWithSender[][]; pageParams: (string | null)[] } | undefined) => {
          if (!old) return old;
          const newPages = [...old.pages];
          newPages[0] = [data, ...(newPages[0] ?? [])];
          return { ...old, pages: newPages };
        },
      );
      // Refresh conversations list
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations(userId ?? '') });
    },
  });
}

// ─── Create or find conversation ────────────────────────────────

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      otherPartyId,
      requestId,
      role,
    }: {
      otherPartyId: string;
      requestId?: string;
      role: 'client' | 'attorney';
    }) => {
      const clientId = role === 'client' ? userId! : otherPartyId;
      const attorneyId = role === 'attorney' ? userId! : otherPartyId;

      // Check if conversation already exists
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('client_id', clientId)
        .eq('attorney_id', attorneyId);

      if (requestId) {
        query = query.eq('request_id', requestId);
      } else {
        query = query.is('request_id', null);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        return existing as unknown as Conversation;
      }

      // Create new conversation
      const insertData: Record<string, unknown> = {
        client_id: clientId,
        attorney_id: attorneyId,
      };
      if (requestId) {
        insertData.request_id = requestId;
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations(userId ?? '') });
    },
  });
}

// ─── Mark conversation read ─────────────────────────────────────

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('conversation_read_cursors')
        .upsert(
          {
            conversation_id: conversationId,
            user_id: userId!,
            last_read_at: new Date().toISOString(),
          } as never,
          { onConflict: 'conversation_id,user_id' },
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations(userId ?? '') });
      queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount(userId ?? '') });
    },
  });
}

// ─── Total unread count ─────────────────────────────────────────

export function useTotalUnreadCount() {
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.profile?.role);
  const setTotalUnread = useUnreadStore((s) => s.setTotalUnread);

  const query = useQuery({
    queryKey: messageKeys.unreadCount(userId ?? ''),
    queryFn: async (): Promise<number> => {
      // Fetch all conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`client_id.eq.${userId},attorney_id.eq.${userId}`);

      if (!conversations || conversations.length === 0) return 0;

      const convoIds = (conversations as { id: string }[]).map((c) => c.id);

      // Fetch read cursors
      const { data: cursors } = await supabase
        .from('conversation_read_cursors')
        .select('*')
        .eq('user_id', userId!)
        .in('conversation_id', convoIds);

      const cursorMap = new Map<string, string>();
      for (const c of (cursors ?? []) as ConversationReadCursor[]) {
        cursorMap.set(c.conversation_id, c.last_read_at);
      }

      let total = 0;
      for (const convo of convoIds) {
        const lastRead = cursorMap.get(convo);
        let query = supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', convo)
          .neq('sender_id', userId!);

        if (lastRead) {
          query = query.gt('created_at', lastRead);
        }

        const { count } = await query;
        total += count ?? 0;
      }

      return total;
    },
    enabled: !!userId && !!role,
    refetchInterval: 30000, // Refresh every 30 seconds as backup
  });

  // Sync to zustand store
  useEffect(() => {
    if (query.data !== undefined) {
      setTotalUnread(query.data);
    }
  }, [query.data, setTotalUnread]);

  return query;
}

// ─── Conversation for a specific request ─────────────────────────

export function useConversationForRequest(requestId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: messageKeys.conversationForRequest(userId ?? '', requestId ?? ''),
    queryFn: async (): Promise<Conversation | null> => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('request_id', requestId!)
        .or(`client_id.eq.${userId},attorney_id.eq.${userId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as unknown as Conversation) ?? null;
    },
    enabled: !!userId && !!requestId,
  });
}
