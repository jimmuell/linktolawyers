import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ChatInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
  isSending?: boolean;
}

export function ChatInput({ onSend, onTyping, isSending }: ChatInputProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [text, setText] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setText('');
  }, [text, isSending, onSend]);

  const handleChangeText = useCallback(
    (value: string) => {
      setText(value);
      onTyping?.();
    },
    [onTyping],
  );

  const hasText = text.trim().length > 0;

  return (
    <View
      style={[
        styles.container,
        { borderTopColor: colors.separator, backgroundColor: colors.background },
      ]}>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: colors.inputBorder,
            backgroundColor: colors.inputBackground,
            color: colors.text,
          },
        ]}
        value={text}
        onChangeText={handleChangeText}
        placeholder="Type a message..."
        placeholderTextColor={colors.inputPlaceholder}
        multiline
        maxLength={2000}
      />
      <Pressable
        style={[
          styles.sendButton,
          { backgroundColor: hasText ? colors.primary : colors.surface },
        ]}
        onPress={handleSend}
        disabled={!hasText || isSending}>
        {isSending ? (
          <ActivityIndicator size="small" color={colors.primaryForeground} />
        ) : (
          <MaterialIcons
            name="send"
            size={20}
            color={hasText ? colors.primaryForeground : colors.textTertiary}
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
