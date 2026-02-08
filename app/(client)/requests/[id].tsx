import { useLocalSearchParams } from 'expo-router';

import { RequestDetailScreen } from '@/components/screens/request-detail-screen';

export default function ClientRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <RequestDetailScreen requestId={id!} variant="client" />;
}
