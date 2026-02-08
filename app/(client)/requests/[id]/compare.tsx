import { useLocalSearchParams } from 'expo-router';

import { QuoteComparisonScreen } from '@/components/screens/quote-comparison-screen';

export default function CompareQuotesScreen() {
  const { id: requestId } = useLocalSearchParams<{ id: string }>();

  return <QuoteComparisonScreen requestId={requestId!} />;
}
