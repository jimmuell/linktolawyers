import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';

const SIZE = 36;

export function ProfileButton() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const avatarUrl = useAuthStore((s) => s.profile?.avatar_url);

  const handlePress = () => {
    router.push('/profile');
  };

  return (
    <Pressable onPress={handlePress} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={[styles.circle, { backgroundColor: colors.surface }]}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <MaterialIcons name="person" size={20} color={colors.textSecondary} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
});
