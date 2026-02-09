import { useLocalSearchParams } from 'expo-router';

import { RequestDetailScreen } from '@/components/screens/request-detail-screen';
import { useSavedRequests, useToggleSaveRequest } from '@/hooks/use-requests';

export default function AttorneyRequestDetailScreen() {
  const { id, initialTab } = useLocalSearchParams<{ id: string; initialTab?: string }>();
  const { data: savedIds } = useSavedRequests();
  const toggleSave = useToggleSaveRequest();

  const isSaved = savedIds?.has(id!) ?? false;

  return (
    <RequestDetailScreen
      requestId={id!}
      variant="attorney"
      isSaved={isSaved}
      onToggleSave={() => toggleSave.mutate({ requestId: id!, isSaved })}
      initialTab={initialTab === 'chat' ? 'chat' : 'details'}
    />
  );
}
