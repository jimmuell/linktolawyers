import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/typography';

interface ImageViewerProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function ImageViewer({ imageUrl, onClose }: ImageViewerProps) {
  const insets = useSafeAreaInsets();

  const handleSave = useCallback(async () => {
    if (!imageUrl) return;
    try {
      if (Platform.OS === 'web') {
        window.open(imageUrl, '_blank');
        return;
      }
      const { downloadAsync, cacheDirectory } = await import('expo-file-system/legacy');
      const MediaLibrary = await import('expo-media-library');

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library access is required to save images.');
        return;
      }

      const fileName = imageUrl.split('/').pop() ?? 'image.jpg';
      const localUri = `${cacheDirectory}${fileName}`;
      await downloadAsync(imageUrl, localUri);
      await MediaLibrary.saveToLibraryAsync(localUri);
      Alert.alert('Saved', 'Image saved to your photo library.');
    } catch {
      Alert.alert('Error', 'Could not save the image.');
    }
  }, [imageUrl]);

  const handleShare = useCallback(async () => {
    if (!imageUrl) return;
    try {
      if (Platform.OS === 'web') {
        window.open(imageUrl, '_blank');
        return;
      }
      const { downloadAsync, cacheDirectory } = await import('expo-file-system/legacy');
      const { shareAsync } = await import('expo-sharing');
      const fileName = imageUrl.split('/').pop() ?? 'image.jpg';
      const localUri = `${cacheDirectory}${fileName}`;
      await downloadAsync(imageUrl, localUri);
      await shareAsync(localUri);
    } catch {
      Alert.alert('Error', 'Could not share the image.');
    }
  }, [imageUrl]);

  return (
    <Modal
      visible={!!imageUrl}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.backdrop}>
        {/* Controls */}
        <View style={[styles.controls, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable style={styles.controlButton} onPress={onClose} hitSlop={12}>
            <MaterialIcons name="close" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={styles.controlGroup}>
            <Pressable style={styles.controlButton} onPress={handleSave} hitSlop={12}>
              <MaterialIcons name="save-alt" size={24} color="#FFFFFF" />
            </Pressable>
            <Pressable style={styles.controlButton} onPress={handleShare} hitSlop={12}>
              <MaterialIcons name="share" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Zoomable image */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          centerContent
          bouncesZoom>
          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="contain"
            />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    zIndex: 10,
  },
  controlGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
