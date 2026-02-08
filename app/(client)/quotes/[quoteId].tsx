import { useLocalSearchParams } from 'expo-router';

import { QuoteDetailScreen } from '@/components/screens/quote-detail-screen';

export default function ClientQuoteDetailScreen() {
  const { quoteId } = useLocalSearchParams<{ quoteId: string }>();

  return <QuoteDetailScreen quoteId={quoteId!} variant="client" />;
}
