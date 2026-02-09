import { useLocalSearchParams } from 'expo-router';

import { RequestDetailScreen } from '@/components/screens/request-detail-screen';

export default function ClientRequestDetailScreen() {
  const { id, initialTab } = useLocalSearchParams<{ id: string; initialTab?: string }>();

  return (
    <RequestDetailScreen
      requestId={id!}
      variant="client"
      initialTab={initialTab === 'chat' ? 'chat' : 'details'}
    />
  );
}
