import { useLocalSearchParams } from 'expo-router';

import { CaseDetailScreen } from '@/components/screens/case-detail-screen';

export default function AttorneyCaseDetailRoute() {
  const { id, initialTab } = useLocalSearchParams<{ id: string; initialTab?: string }>();

  return (
    <CaseDetailScreen
      requestId={id}
      variant="attorney"
      initialTab={initialTab === 'chat' ? 'chat' : 'details'}
    />
  );
}
