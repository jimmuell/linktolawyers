import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { usePresenceStore } from '@/stores/presence-store';

export function useGlobalPresence() {
  const userId = useAuthStore((s) => s.user?.id);
  const setOnlineUsers = usePresenceStore((s) => s.setOnlineUsers);
  const channelRef = useRef<ReturnType<typeof supabase.channel>>(undefined);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('presence:app', {
      config: { presence: { key: userId } },
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineIds = new Set<string>(Object.keys(state));
        setOnlineUsers(onlineIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId, online_at: new Date().toISOString() });
        }
      });

    // Track/untrack on app state changes
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (!channelRef.current) return;
      if (nextState === 'active') {
        await channelRef.current.track({ userId, online_at: new Date().toISOString() });
      } else if (nextState === 'background' || nextState === 'inactive') {
        await channelRef.current.untrack();
      }
    });

    return () => {
      subscription.remove();
      supabase.removeChannel(channel);
      channelRef.current = undefined;
    };
  }, [userId, setOnlineUsers]);
}
