import { useLocalSearchParams } from 'expo-router';

import { CaseDetailScreen } from '@/components/screens/case-detail-screen';

export default function ClientCaseDetailRoute() {
  const { id, initialTab } = useLocalSearchParams<{ id: string; initialTab?: string }>();

  return (
    <CaseDetailScreen
      requestId={id}
      variant="client"
      initialTab={initialTab === 'chat' ? 'chat' : 'details'}
    />
  );
}
