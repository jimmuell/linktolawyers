import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { QuoteCard } from '@/components/ui/quote-card';
import { Colors } from '@/constants/theme';
import { Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRequestQuotes } from '@/hooks/use-quotes';
import type { QuoteWithAttorney } from '@/types';

export default function RequestQuotesScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const { id: requestId } = useLocalSearchParams<{ id: string }>();

  const { data: quotes, isLoading, refetch, isRefetching } = useRequestQuotes(requestId);

  const handleQuotePress = (quote: QuoteWithAttorney) => {
    router.push(`/(client)/quotes/${quote.id}?requestId=${requestId}`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Quotes</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {isLoading && !quotes ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <QuoteCard
              quote={item}
              variant="client"
              onPress={() => handleQuotePress(item)}
            />
          )}
          contentContainerStyle={quotes?.length ? styles.list : styles.emptyList}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="request-quote"
              title="No quotes yet"
              description="Attorneys haven't submitted quotes for this request yet."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: Spacing.lg,
  },
  emptyList: {
    flex: 1,
  },
});
