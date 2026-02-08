import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing, Typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AvailabilityScreen() {
  const background = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textTertiary = useThemeColor({}, 'textTertiary');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="close" size={26} color={textColor} />
        </Pressable>
        <Text style={[Typography.headlineLarge, { color: textColor }]}>Availability</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.emptyState}>
        <MaterialIcons name="event-available" size={48} color={textTertiary} />
        <Text style={[Typography.titleSmall, { color: textSecondary, marginTop: Spacing.lg }]}>
          Coming Soon
        </Text>
        <Text style={[Typography.bodySmall, { color: textTertiary, textAlign: 'center' }]}>
          Set your availability schedule so clients know when you are open for consultations.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.xxs,
  },
});
