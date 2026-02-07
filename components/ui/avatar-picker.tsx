import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { Radii } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

let ImagePicker: typeof import('expo-image-picker') | null = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {
  // Native module not available (needs dev build rebuild)
}

interface AvatarPickerProps {
  uri: string | null;
  onPick: (uri: string) => Promise<void>;
  size?: number;
}

export function AvatarPicker({ uri, onPick, size = 100 }: AvatarPickerProps) {
  const [uploading, setUploading] = useState(false);
  const surface = useThemeColor({}, 'surface');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primary = useThemeColor({}, 'primary');

  const handlePick = async () => {
    if (!ImagePicker) {
      Alert.alert(
        'Dev Build Required',
        'expo-image-picker is not available. Rebuild your dev client to enable avatar uploads.',
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      await onPick(result.assets[0].uri);
    } catch (error) {
      Alert.alert('Upload Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Pressable onPress={handlePick} disabled={uploading} style={styles.container}>
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: surface },
        ]}
      >
        {uploading ? (
          <ActivityIndicator color={primary} />
        ) : uri ? (
          <Image
            source={{ uri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            contentFit="cover"
          />
        ) : (
          <MaterialIcons name="person" size={size * 0.5} color={textSecondary} />
        )}
      </View>
      <View style={[styles.badge, { backgroundColor: primary }]}>
        <MaterialIcons name="camera-alt" size={16} color="#fff" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'relative',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
