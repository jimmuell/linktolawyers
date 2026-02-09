import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { StagedAttachment } from '@/types';

interface ChatInputProps {
  onSend: (text: string, attachments: StagedAttachment[]) => void;
  onTyping?: () => void;
  isSending?: boolean;
}

export function ChatInput({ onSend, onTyping, isSending }: ChatInputProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<StagedAttachment[]>([]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || isSending) return;
    onSend(trimmed, attachments);
    setText('');
    setAttachments([]);
  }, [text, attachments, isSending, onSend]);

  const handleChangeText = useCallback(
    (value: string) => {
      setText(value);
      onTyping?.();
    },
    [onTyping],
  );

  const pickFromLibrary = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const fileName = asset.fileName ?? `image_${Date.now()}.jpg`;
    setAttachments((prev) => [
      ...prev,
      {
        uri: asset.uri,
        fileName,
        fileType: asset.mimeType ?? 'image/jpeg',
        fileSize: asset.fileSize ?? 0,
        width: asset.width,
        height: asset.height,
      },
    ]);
  }, []);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const fileName = asset.fileName ?? `photo_${Date.now()}.jpg`;
    setAttachments((prev) => [
      ...prev,
      {
        uri: asset.uri,
        fileName,
        fileType: asset.mimeType ?? 'image/jpeg',
        fileSize: asset.fileSize ?? 0,
        width: asset.width,
        height: asset.height,
      },
    ]);
  }, []);

  const pickDocument = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setAttachments((prev) => [
      ...prev,
      {
        uri: asset.uri,
        fileName: asset.name,
        fileType: asset.mimeType ?? 'application/pdf',
        fileSize: asset.size ?? 0,
      },
    ]);
  }, []);

  const handleAttachPress = useCallback(() => {
    const options = ['Photo Library', 'Take Photo', 'Document (PDF)', 'Cancel'];
    const cancelButtonIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex },
        (buttonIndex) => {
          if (buttonIndex === 0) pickFromLibrary();
          else if (buttonIndex === 1) takePhoto();
          else if (buttonIndex === 2) pickDocument();
        },
      );
    } else {
      Alert.alert('Add Attachment', undefined, [
        { text: 'Photo Library', onPress: pickFromLibrary },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Document (PDF)', onPress: pickDocument },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [pickFromLibrary, takePhoto, pickDocument]);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const hasContent = text.trim().length > 0 || attachments.length > 0;

  return (
    <View
      style={[
        styles.container,
        { borderTopColor: colors.separator, backgroundColor: colors.background },
      ]}>
      {/* Attachment preview strip */}
      {attachments.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.previewStrip}
          contentContainerStyle={styles.previewStripContent}>
          {attachments.map((att, index) => (
            <View key={`${att.fileName}-${index}`} style={styles.previewItem}>
              {att.fileType.startsWith('image/') ? (
                <Image source={{ uri: att.uri }} style={styles.previewImage} />
              ) : (
                <View style={[styles.previewDoc, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name="picture-as-pdf" size={24} color={colors.error} />
                  <ThemedText style={styles.previewDocName} numberOfLines={1}>
                    {att.fileName}
                  </ThemedText>
                </View>
              )}
              <Pressable
                style={[styles.removeButton, { backgroundColor: colors.error }]}
                onPress={() => removeAttachment(index)}
                hitSlop={8}>
                <MaterialIcons name="close" size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        <Pressable
          style={styles.attachButton}
          onPress={handleAttachPress}
          disabled={isSending}
          hitSlop={8}>
          <MaterialIcons name="attach-file" size={24} color={colors.textSecondary} />
        </Pressable>

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
            { backgroundColor: hasContent ? colors.primary : colors.surface },
          ]}
          onPress={handleSend}
          disabled={!hasContent || isSending}>
          {isSending ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <MaterialIcons
              name="send"
              size={20}
              color={hasContent ? colors.primaryForeground : colors.textTertiary}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const PREVIEW_SIZE = 60;

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewStrip: {
    maxHeight: PREVIEW_SIZE + Spacing.md * 2,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  previewStripContent: {
    gap: Spacing.sm,
    alignItems: 'center',
  },
  previewItem: {
    position: 'relative',
  },
  previewImage: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: Radii.sm,
  },
  previewDoc: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  previewDocName: {
    fontSize: 8,
    maxWidth: PREVIEW_SIZE - 8,
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
