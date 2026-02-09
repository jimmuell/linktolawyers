import * as Notifications from 'expo-notifications';
import type { EventSubscription } from 'expo-modules-core';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import type { RequestStatus } from '@/types';

// Show notifications even when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useRegisterPushToken() {
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.profile?.role);
  const responseListenerRef = useRef<EventSubscription>(undefined);

  useEffect(() => {
    if (!userId || !role) return;

    // Register push token
    (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'e5e360be-4b42-4bfd-9c73-983ace899aa7',
      });

      const token = tokenData.data;

      // Upsert token into push_tokens table
      await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: userId,
            token,
            platform: Platform.OS as 'ios' | 'android' | 'web',
          } as never,
          { onConflict: 'user_id,token' },
        );
    })();

    // Handle notification tap → navigate to conversation
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as {
          requestId?: string;
          requestStatus?: RequestStatus;
          role?: 'client' | 'attorney';
          initialTab?: string;
        };

        const { requestId, requestStatus, role: recipientRole, initialTab } = data;
        if (!requestId || !recipientRole) return;

        const tab = initialTab ?? 'chat';

        if (requestStatus === 'accepted' || requestStatus === 'closed') {
          router.push({
            pathname: recipientRole === 'client'
              ? '/(client)/cases/[id]'
              : '/(attorney)/cases/[id]',
            params: { id: requestId, initialTab: tab },
          } as never);
        } else {
          if (recipientRole === 'client') {
            router.push({
              pathname: '/(client)/requests/[id]',
              params: { id: requestId, initialTab: tab },
            } as never);
          } else {
            router.push({
              pathname: '/(attorney)/browse/[id]',
              params: { id: requestId, initialTab: tab },
            } as never);
          }
        }
      },
    );

    return () => {
      responseListenerRef.current?.remove();
    };
  }, [userId, role]);
}
