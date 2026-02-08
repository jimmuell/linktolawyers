import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';

import { CreateQuoteForm } from '@/components/screens/create-quote-form';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useQuote } from '@/hooks/use-quotes';

export default function EditQuoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { data: quote, isLoading } = useQuote(id);

  if (isLoading || !quote) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <ThemedText>Quote not found.</ThemedText>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return <CreateQuoteForm requestId={quote.request_id} editQuote={quote} />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
