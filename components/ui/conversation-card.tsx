import { MaterialIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ConversationWithDetails } from '@/types';

interface ConversationCardProps {
  conversation: ConversationWithDetails;
  onPress: () => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const AVATAR_SIZE = 48;

export function ConversationCard({ conversation, onPress }: ConversationCardProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const hasUnread = conversation.unreadCount > 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? colors.surface : colors.background },
      ]}
      onPress={onPress}>
      {/* Avatar */}
      {conversation.otherParty.avatar_url ? (
        <Image
          source={{ uri: conversation.otherParty.avatar_url }}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
          <MaterialIcons name="person" size={24} color={colors.textTertiary} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <ThemedText
            style={[styles.name, hasUnread && styles.nameBold]}
            numberOfLines={1}>
            {conversation.otherParty.full_name ?? 'User'}
          </ThemedText>
          {conversation.last_message_at && (
            <ThemedText style={[styles.time, { color: hasUnread ? colors.primary : colors.textTertiary }]}>
              {formatTime(conversation.last_message_at)}
            </ThemedText>
          )}
        </View>

        {conversation.requestTitle && (
          <ThemedText style={[styles.requestTitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {conversation.requestTitle}
          </ThemedText>
        )}

        <View style={styles.bottomRow}>
          <ThemedText
            style={[
              styles.preview,
              { color: hasUnread ? colors.text : colors.textSecondary },
              hasUnread && styles.previewBold,
            ]}
            numberOfLines={1}>
            {conversation.last_message_text ?? 'No messages yet'}
          </ThemedText>
          {hasUnread && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.badgeText}>
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: Spacing.sm,
  },
  nameBold: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
  },
  requestTitle: {
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  preview: {
    fontSize: 14,
    flex: 1,
  },
  previewBold: {
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
