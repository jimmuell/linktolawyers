import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { MessageWithSender } from '@/types';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showTimestamp?: boolean;
}

function formatMessageTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function MessageBubble({ message, isOwn, showTimestamp = true }: MessageBubbleProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  if (message.is_system) {
    return (
      <View style={styles.systemContainer}>
        <ThemedText style={[styles.systemText, { color: colors.textTertiary }]}>
          {message.content}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View
        style={[
          styles.bubble,
          isOwn
            ? [styles.ownBubble, { backgroundColor: colors.primary }]
            : [styles.otherBubble, { backgroundColor: colors.surface }],
        ]}>
        <ThemedText
          style={[
            styles.messageText,
            { color: isOwn ? colors.primaryForeground : colors.text },
          ]}>
          {message.content}
        </ThemedText>
      </View>
      {showTimestamp && (
        <ThemedText
          style={[
            styles.timestamp,
            { color: colors.textTertiary },
            isOwn ? styles.ownTimestamp : styles.otherTimestamp,
          ]}>
          {formatMessageTime(message.created_at)}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: Spacing.lg,
    maxWidth: '100%',
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  ownBubble: {
    borderRadius: Radii.xl,
    borderBottomRightRadius: Radii.xs,
  },
  otherBubble: {
    borderRadius: Radii.xl,
    borderBottomLeftRadius: Radii.xs,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  ownTimestamp: {
    marginRight: Spacing.xs,
  },
  otherTimestamp: {
    marginLeft: Spacing.xs,
  },
  systemContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  systemText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
