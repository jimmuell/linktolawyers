import { supabase } from '@/lib/supabase';
import type { RequestStatus } from '@/types';

/**
 * Notify attorneys whose practice areas match a newly submitted request.
 * Fire-and-forget — errors are silently ignored.
 */
export function notifyMatchingAttorneys({
  requestId,
  requestTitle,
  practiceArea,
}: {
  requestId: string;
  requestTitle: string;
  practiceArea: string;
}) {
  supabase.functions
    .invoke('notify-matching-attorneys', {
      body: { requestId, requestTitle, practiceArea },
    })
    .catch(() => {
      // Best-effort — ignore errors
    });
}

/**
 * Notify a user about a request status change (e.g. new quote, case closed).
 * Fire-and-forget — errors are silently ignored.
 */
export function sendRequestStatusNotification({
  recipientId,
  title,
  body,
  requestId,
  requestStatus,
  recipientRole,
}: {
  recipientId: string;
  title: string;
  body: string;
  requestId: string;
  requestStatus: RequestStatus;
  recipientRole: 'client' | 'attorney';
}) {
  supabase.functions
    .invoke('send-push-notification', {
      body: {
        recipientId,
        title,
        body,
        data: { requestId, requestStatus, role: recipientRole, initialTab: 'details' },
      },
    })
    .catch(() => {
      // Best-effort — ignore errors
    });
}
