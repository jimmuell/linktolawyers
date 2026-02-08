import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { QuoteCard } from '@/components/ui/quote-card';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAttorneyQuotes } from '@/hooks/use-quotes';
import type { QuoteStatus, QuoteWithRequest } from '@/types';

const STATUS_TABS: { label: string; value: QuoteStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Viewed', value: 'viewed' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Declined', value: 'declined' },
  { label: 'Withdrawn', value: 'withdrawn' },
];

export default function QuotesScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | undefined>(undefined);

  const { data: quotes, isLoading, refetch, isRefetching } = useAttorneyQuotes(statusFilter);

  const handleQuotePress = useCallback(
    (quote: QuoteWithRequest) => {
      router.push(`/(attorney)/quotes/${quote.id}`);
    },
    [router],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <ThemedText style={styles.title}>Your Quotes</ThemedText>
        <Pressable onPress={() => router.push('/(attorney)/quotes/templates')} hitSlop={8}>
          <MaterialIcons name="content-copy" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}>
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <Pressable
              key={tab.label}
              style={[
                styles.filterChip,
                { borderColor: isActive ? colors.primary : colors.border },
                isActive && { backgroundColor: colors.surface },
              ]}
              onPress={() => setStatusFilter(tab.value)}>
              <ThemedText
                style={[
                  styles.filterText,
                  { color: isActive ? colors.primary : colors.textSecondary },
                ]}>
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

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
              variant="attorney"
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
              description="Browse requests and submit quotes to get started."
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
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
