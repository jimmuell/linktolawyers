import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { MessageAttachment, MessageWithSender } from '@/types';

export type AttachmentAction = 'view' | 'download' | 'delete';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showTimestamp?: boolean;
  onImagePress?: (imageUrl: string) => void;
  onDocumentPress?: (attachment: MessageAttachment) => void;
  onAttachmentAction?: (attachment: MessageAttachment, action: AttachmentAction) => void;
}

function formatMessageTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function showAttachmentActions(
  attachment: MessageAttachment,
  isOwn: boolean,
  isImage: boolean,
  onAction: (action: AttachmentAction) => void,
) {
  const options: string[] = isImage
    ? ['View', 'Save to Photos', ...(isOwn ? ['Delete'] : []), 'Cancel']
    : ['View', 'Download', ...(isOwn ? ['Delete'] : []), 'Cancel'];
  const destructiveIndex = isOwn ? options.length - 2 : undefined;
  const cancelIndex = options.length - 1;

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: cancelIndex,
        destructiveButtonIndex: destructiveIndex,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) onAction('view');
        else if (buttonIndex === 1) onAction('download');
        else if (isOwn && buttonIndex === 2) onAction('delete');
      },
    );
  } else {
    const buttons = [
      { text: options[0], onPress: () => onAction('view') },
      { text: options[1], onPress: () => onAction('download') },
      ...(isOwn ? [{ text: 'Delete', style: 'destructive' as const, onPress: () => onAction('delete') }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ];
    Alert.alert(attachment.file_name, undefined, buttons);
  }
}

export function MessageBubble({
  message,
  isOwn,
  showTimestamp = true,
  onImagePress,
  onDocumentPress,
  onAttachmentAction,
}: MessageBubbleProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const attachments = message.message_attachments ?? [];
  const imageAttachments = attachments.filter((a) => a.file_type.startsWith('image/'));
  const docAttachments = attachments.filter((a) => !a.file_type.startsWith('image/'));

  const handleLongPress = useCallback(
    (attachment: MessageAttachment, isImage: boolean) => {
      if (!onAttachmentAction) return;
      showAttachmentActions(attachment, isOwn, isImage, (action) =>
        onAttachmentAction(attachment, action),
      );
    },
    [isOwn, onAttachmentAction],
  );

  if (message.is_system) {
    return (
      <View style={styles.systemContainer}>
        <ThemedText style={[styles.systemText, { color: colors.textTertiary }]}>
          {message.content}
        </ThemedText>
      </View>
    );
  }

  const hasTextContent =
    message.content &&
    message.content !== 'Sent an image' &&
    message.content !== 'Sent a document';

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View
        style={[
          styles.bubble,
          isOwn
            ? [styles.ownBubble, { backgroundColor: colors.primary }]
            : [styles.otherBubble, { backgroundColor: colors.surface }],
          attachments.length > 0 && styles.bubbleWithAttachments,
        ]}>
        {/* Text content */}
        {hasTextContent && (
          <ThemedText
            style={[
              styles.messageText,
              { color: isOwn ? colors.primaryForeground : colors.text },
              attachments.length > 0 && styles.messageTextWithAttachments,
            ]}>
            {message.content}
          </ThemedText>
        )}

        {/* Image attachments */}
        {imageAttachments.map((att) => {
          const aspectRatio =
            att.width && att.height ? att.width / att.height : 4 / 3;
          return (
            <Pressable
              key={att.id}
              onPress={() => onImagePress?.(att.file_url)}
              onLongPress={() => handleLongPress(att, true)}>
              <Image
                source={{ uri: att.file_url }}
                style={[styles.attachmentImage, { aspectRatio }]}
                contentFit="cover"
              />
            </Pressable>
          );
        })}

        {/* Document attachments */}
        {docAttachments.map((att) => (
          <Pressable
            key={att.id}
            style={[
              styles.docCard,
              {
                backgroundColor: isOwn
                  ? 'rgba(255,255,255,0.15)'
                  : colors.background,
              },
            ]}
            onPress={() => onDocumentPress?.(att)}
            onLongPress={() => handleLongPress(att, false)}>
            <MaterialIcons name="picture-as-pdf" size={28} color={colors.error} />
            <View style={styles.docInfo}>
              <ThemedText
                style={[
                  styles.docName,
                  { color: isOwn ? colors.primaryForeground : colors.text },
                ]}
                numberOfLines={1}>
                {att.file_name}
              </ThemedText>
              <ThemedText
                style={[
                  styles.docSize,
                  { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textTertiary },
                ]}>
                {formatFileSize(att.file_size)}
              </ThemedText>
            </View>
            <MaterialIcons
              name="download"
              size={20}
              color={isOwn ? colors.primaryForeground : colors.textSecondary}
            />
          </Pressable>
        ))}
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

const IMAGE_MAX_WIDTH = 220;

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
  bubbleWithAttachments: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    overflow: 'hidden',
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
  messageTextWithAttachments: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  attachmentImage: {
    width: IMAGE_MAX_WIDTH,
    borderRadius: Radii.md,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    minWidth: 180,
  },
  docInfo: {
    flex: 1,
    gap: 1,
  },
  docName: {
    fontSize: 13,
    fontWeight: '500',
  },
  docSize: {
    fontSize: 11,
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
