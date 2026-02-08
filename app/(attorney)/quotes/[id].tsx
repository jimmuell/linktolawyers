import { useLocalSearchParams } from 'expo-router';

import { QuoteDetailScreen } from '@/components/screens/quote-detail-screen';

export default function AttorneyQuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <QuoteDetailScreen quoteId={id!} variant="attorney" />;
}
