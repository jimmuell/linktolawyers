import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { RequestCard } from '@/components/ui/request-card';
import { Colors } from '@/constants/theme';
import { Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  type BrowseFilters,
  useBrowseRequests,
  useHiddenRequests,
  useSavedRequests,
  useToggleSaveRequest,
} from '@/hooks/use-requests';
import type { RequestWithClient } from '@/types';

export default function BrowseScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const [filters, setFilters] = useState<BrowseFilters>({});

  const { data: requests, isLoading, refetch, isRefetching } = useBrowseRequests(filters);
  const { data: savedIds } = useSavedRequests();
  const { data: hiddenIds } = useHiddenRequests();
  const toggleSave = useToggleSaveRequest();

  // Filter out hidden requests client-side
  const visibleRequests = useMemo(() => {
    if (!requests) return [];
    if (!hiddenIds || hiddenIds.size === 0) return requests;
    return requests.filter((r) => !hiddenIds.has(r.id));
  }, [requests, hiddenIds]);

  const handleRequestPress = useCallback(
    (request: RequestWithClient) => {
      router.push(`/(attorney)/browse/${request.id}`);
    },
    [router],
  );

  const handleToggleSave = useCallback(
    (requestId: string) => {
      const isSaved = savedIds?.has(requestId) ?? false;
      toggleSave.mutate({ requestId, isSaved });
    },
    [savedIds, toggleSave],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <ThemedText style={styles.title}>Browse Requests</ThemedText>
      </View>

      <FilterBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visibleRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              variant="attorney"
              onPress={() => handleRequestPress(item)}
              isSaved={savedIds?.has(item.id) ?? false}
              onToggleSave={() => handleToggleSave(item.id)}
            />
          )}
          contentContainerStyle={visibleRequests.length ? styles.list : styles.emptyList}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="No requests found"
              description="Check back later or adjust your filters."
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
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
