import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface LocalAttachment {
  uri: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

function isPdf(fileType: string): boolean {
  return fileType === 'application/pdf' || fileType.endsWith('.pdf');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface StepAttachmentsProps {
  attachments: LocalAttachment[];
  onAdd: (attachment: LocalAttachment) => void;
  onRemove: (index: number) => void;
}

export function StepAttachments({ attachments, onAdd, onRemove }: StepAttachmentsProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onAdd({
        uri: asset.uri,
        fileName: asset.fileName ?? `image_${Date.now()}.jpg`,
        fileType: asset.mimeType ?? 'image/jpeg',
        fileSize: asset.fileSize ?? 0,
      });
    }
  };

  const pickDocument = async () => {
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onAdd({
          uri: asset.uri,
          fileName: asset.name,
          fileType: asset.mimeType ?? 'application/pdf',
          fileSize: asset.size ?? 0,
        });
      }
    } catch {
      Alert.alert('Not Available', 'PDF picking requires a new dev build. Please create one with `eas build --profile development`.');
    }
  };

  const confirmRemove = (index: number) => {
    Alert.alert('Remove Attachment', 'Are you sure you want to remove this file?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(index) },
    ]);
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.heading}>Add Attachments (optional)</ThemedText>
      <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
        Attach relevant photos, screenshots, or PDF documents.
      </ThemedText>

      <View style={styles.grid}>
        {attachments.map((att, i) => (
          <View key={att.uri} style={[styles.fileWrapper, { borderColor: colors.border }]}>
            {isPdf(att.fileType) ? (
              <View style={[styles.pdfPreview, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="picture-as-pdf" size={28} color={colors.error} />
                <ThemedText style={[styles.pdfName, { color: colors.text }]} numberOfLines={2}>
                  {att.fileName}
                </ThemedText>
                <ThemedText style={[styles.pdfSize, { color: colors.textTertiary }]}>
                  {formatFileSize(att.fileSize)}
                </ThemedText>
              </View>
            ) : (
              <Image source={{ uri: att.uri }} style={styles.image} />
            )}
            <Pressable
              style={[styles.removeButton, { backgroundColor: colors.error }]}
              onPress={() => confirmRemove(i)}>
              <MaterialIcons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.addButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={pickImage}>
          <MaterialIcons name="add-photo-alternate" size={28} color={colors.textTertiary} />
          <ThemedText style={[styles.addText, { color: colors.textTertiary }]}>Image</ThemedText>
        </Pressable>

        <Pressable
          style={[styles.addButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={pickDocument}>
          <MaterialIcons name="picture-as-pdf" size={28} color={colors.textTertiary} />
          <ThemedText style={[styles.addText, { color: colors.textTertiary }]}>PDF</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: -Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  fileWrapper: {
    width: 100,
    height: 100,
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pdfPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xs,
    gap: 2,
  },
  pdfName: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 11,
  },
  pdfSize: {
    fontSize: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  addButton: {
    flex: 1,
    height: 80,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  addText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
