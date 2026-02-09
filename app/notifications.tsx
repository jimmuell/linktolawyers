import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radii, Spacing, Typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function NotificationsScreen() {
  const background = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textTertiary = useThemeColor({}, 'textTertiary');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const border = useThemeColor({}, 'border');

  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  const checkPermission = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  }, []);

  useEffect(() => {
    checkPermission();

    // Re-check when returning from system settings
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkPermission();
      }
    });

    return () => subscription.remove();
  }, [checkPermission]);

  const isEnabled = permissionStatus === 'granted';

  const handleToggle = useCallback(async () => {
    if (isEnabled) {
      // Can't revoke programmatically — direct user to system settings
      Alert.alert(
        'Disable Notifications',
        'To turn off notifications, go to your device settings for this app.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ],
      );
    } else {
      // Request permission
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Notifications are disabled in your device settings. Please enable them to receive message alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ],
        );
      }
    }
  }, [isEnabled]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="close" size={26} color={textColor} />
        </Pressable>
        <Text style={[Typography.headlineLarge, { color: textColor }]}>Notifications</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.content}>
        <Text style={[Typography.titleMedium, styles.sectionLabel, { color: textSecondary }]}>
          Push Notifications
        </Text>

        <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.option}>
            <View style={styles.optionLeft}>
              <MaterialIcons
                name="notifications-active"
                size={22}
                color={isEnabled ? primary : textSecondary}
              />
              <View style={styles.optionText}>
                <Text style={[Typography.bodyLarge, { color: textColor, marginLeft: Spacing.md }]}>
                  Message Notifications
                </Text>
                <Text style={[Typography.bodySmall, { color: textTertiary, marginLeft: Spacing.md }]}>
                  Get notified when you receive new messages
                </Text>
              </View>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggle}
              trackColor={{ true: primary }}
            />
          </View>
        </View>

        {permissionStatus === 'denied' && (
          <Text style={[Typography.bodySmall, { color: textTertiary, marginTop: Spacing.sm }]}>
            Notifications are blocked. Tap the toggle to open settings and enable them.
          </Text>
        )}
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
  content: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    flex: 1,
  },
});
