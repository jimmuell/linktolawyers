import { useLocalSearchParams } from 'expo-router';

import { CaseDetailScreen } from '@/components/screens/case-detail-screen';

export default function ClientCaseDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <CaseDetailScreen requestId={id} variant="client" />;
}
