import { useLocalSearchParams } from 'expo-router';

import { CaseDetailScreen } from '@/components/screens/case-detail-screen';

export default function AttorneyCaseDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <CaseDetailScreen requestId={id} variant="attorney" />;
}
