import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import Constants from 'expo-constants';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CaseCard } from '@/components/ui/case-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ProfileButton } from '@/components/ui/profile-button';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useCases } from '@/hooks/use-cases';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CaseWithDetails } from '@/types';

const FILTER_TABS: { label: string; value: 'accepted' | 'closed' | 'archived' | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'accepted' },
  { label: 'Closed', value: 'closed' },
  { label: 'Archived', value: 'archived' },
];

export default function AttorneyCasesScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'accepted' | 'closed' | 'archived' | undefined>(undefined);

  const { data: cases, isLoading, refetch, isRefetching } = useCases('attorney', statusFilter);

  const handleCasePress = useCallback(
    (caseData: CaseWithDetails) => {
      router.push(`/(attorney)/cases/${caseData.request.id}`);
    },
    [router],
  );

  return (
    <View style={[styles.safe, { backgroundColor: colors.background, paddingTop: Math.max(Constants.statusBarHeight, 50) }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <ThemedText style={styles.title}>Your Cases</ThemedText>
        <ProfileButton />
      </View>

      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => {
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

      {isLoading && !cases ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={cases}
          keyExtractor={(item) => item.request.id}
          renderItem={({ item }) => (
            <CaseCard caseData={item} onPress={() => handleCasePress(item)} />
          )}
          contentContainerStyle={cases?.length ? styles.list : styles.emptyList}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="work"
              title="No cases yet"
              description="When a client accepts your quote, it will appear here as an active case."
            />
          }
        />
      )}
    </View>
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
    paddingTop: Spacing.md,
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
