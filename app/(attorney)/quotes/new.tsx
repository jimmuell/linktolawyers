import { useLocalSearchParams } from 'expo-router';

import { CreateQuoteForm } from '@/components/screens/create-quote-form';

export default function NewQuoteScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();

  return <CreateQuoteForm requestId={requestId!} />;
}
