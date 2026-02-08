import { useLocalSearchParams } from 'expo-router';

import { RequestSuccessScreen } from '@/components/screens/request-success-screen';
import type { RequestStatus } from '@/types';

export default function SuccessScreen() {
  const { requestId, status } = useLocalSearchParams<{ requestId: string; status: string }>();

  return (
    <RequestSuccessScreen
      requestId={requestId!}
      status={(status as RequestStatus) ?? 'pending'}
    />
  );
}
