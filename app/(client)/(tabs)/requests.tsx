import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { RequestCard } from '@/components/ui/request-card';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAcceptedQuotes } from '@/hooks/use-quotes';
import { useClientRequests } from '@/hooks/use-requests';
import type { Request, RequestStatus } from '@/types';

const STATUS_TABS: { label: string; value: RequestStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Drafts', value: 'draft' },
  { label: 'Pending', value: 'pending' },
  { label: 'Quoted', value: 'quoted' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Closed', value: 'closed' },
];

export default function RequestsScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<RequestStatus | undefined>(undefined);

  const { data: requests, isLoading, refetch, isRefetching } = useClientRequests(statusFilter);
  const showAcceptedQuotes = statusFilter === 'accepted' || statusFilter === 'closed';
  const { data: acceptedQuotesMap } = useAcceptedQuotes();

  const handleNewRequest = useCallback(() => {
    router.push('/(client)/requests/new');
  }, [router]);

  const handleRequestPress = useCallback(
    (request: Request) => {
      router.push(`/(client)/requests/${request.id}`);
    },
    [router],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <ThemedText style={styles.title}>Your Requests</ThemedText>
        <Pressable
          style={[styles.newButton, { backgroundColor: colors.primary }]}
          onPress={handleNewRequest}>
          <ThemedText style={[styles.newButtonText, { color: colors.primaryForeground }]}>
            + New
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
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
      </View>

      {isLoading && !requests ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              variant="client"
              onPress={() => handleRequestPress(item)}
              acceptedQuote={showAcceptedQuotes ? acceptedQuotesMap?.get(item.id) : undefined}
            />
          )}
          contentContainerStyle={requests?.length ? styles.list : styles.emptyList}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="description"
              title="No requests yet"
              description="Create your first request to get matched with attorneys."
              actionLabel="Create Request"
              onAction={handleNewRequest}
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
  newButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
  },
  newButtonText: {
    fontSize: 15,
    fontWeight: '600',
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
