import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ConversationCard } from '@/components/ui/conversation-card';
import { ProfileButton } from '@/components/ui/profile-button';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useConversations, useTotalUnreadCount } from '@/hooks/use-messages';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ConversationWithDetails } from '@/types';

interface ConversationsListScreenProps {
  variant: 'client' | 'attorney';
}

export function ConversationsListScreen({ variant }: ConversationsListScreenProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: conversations, isLoading, refetch, isRefetching } = useConversations();
  useTotalUnreadCount();

  const filtered = useMemo(() => {
    if (!conversations) return [];
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.otherParty.full_name?.toLowerCase().includes(q) ||
        c.last_message_text?.toLowerCase().includes(q) ||
        c.requestTitle?.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const handlePress = useCallback(
    (conversation: ConversationWithDetails) => {
      const requestId = conversation.request_id;
      const status = conversation.requestStatus;

      if (!requestId) {
        // No linked request — shouldn't happen in normal flow, but handle gracefully
        return;
      }

      // Route based on request status
      if (status === 'accepted' || status === 'closed') {
        // Navigate to case detail with chat tab
        if (variant === 'client') {
          router.push({
            pathname: '/(client)/cases/[id]',
            params: { id: requestId, initialTab: 'chat' },
          } as never);
        } else {
          router.push({
            pathname: '/(attorney)/cases/[id]',
            params: { id: requestId, initialTab: 'chat' },
          } as never);
        }
      } else {
        // Navigate to request detail with chat tab
        if (variant === 'client') {
          router.push({
            pathname: '/(client)/requests/[id]',
            params: { id: requestId, initialTab: 'chat' },
          } as never);
        } else {
          router.push({
            pathname: '/(attorney)/browse/[id]',
            params: { id: requestId, initialTab: 'chat' },
          } as never);
        }
      }
    },
    [router, variant],
  );

  const renderItem = useCallback(
    ({ item }: { item: ConversationWithDetails }) => (
      <ConversationCard conversation={item} onPress={() => handlePress(item)} />
    ),
    [handlePress],
  );

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: Math.max(Constants.statusBarHeight, 50) },
      ]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <ThemedText style={styles.title}>Messages</ThemedText>
        <ProfileButton />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <MaterialIcons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search conversations..."
            placeholderTextColor={colors.inputPlaceholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <MaterialIcons
              name="close"
              size={18}
              color={colors.textTertiary}
              onPress={() => setSearch('')}
            />
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="forum" size={48} color={colors.textTertiary} />
              <ThemedText style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                {search ? 'No matching conversations' : 'No messages yet'}
              </ThemedText>
              <ThemedText style={[styles.emptyDescription, { color: colors.textTertiary }]}>
                {search
                  ? 'Try a different search term.'
                  : variant === 'client'
                    ? 'Messages from attorneys will appear here.'
                    : 'Messages from clients will appear here.'}
              </ThemedText>
            </View>
          }
          ItemSeparatorComponent={() => (
            <View
              style={[
                styles.separator,
                { backgroundColor: colors.separator, marginLeft: Spacing.lg + 48 + Spacing.md },
              ]}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    marginTop: Spacing['5xl'],
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
