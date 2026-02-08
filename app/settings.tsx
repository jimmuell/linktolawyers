import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radii, Spacing, Typography } from '@/constants/typography';
import { type ThemePreference, useThemeContext } from '@/contexts/theme-context';
import { useThemeColor } from '@/hooks/use-theme-color';

const ONBOARDING_KEY = '@linktolawyers/onboarding-complete';

const themeOptions: { value: ThemePreference; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { value: 'light', label: 'Light', icon: 'light-mode' },
  { value: 'dark', label: 'Dark', icon: 'dark-mode' },
  { value: 'system', label: 'System', icon: 'settings-brightness' },
];

export default function SettingsScreen() {
  const { preference, setPreference } = useThemeContext();
  const background = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const border = useThemeColor({}, 'border');

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (__DEV__) {
      AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
        setShowOnboarding(value !== 'true');
      });
    }
  }, []);

  const handleToggleOnboarding = async (value: boolean) => {
    setShowOnboarding(value);
    if (value) {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="close" size={26} color={textColor} />
        </Pressable>
        <Text style={[Typography.headlineLarge, { color: textColor }]}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.content}>
        <Text style={[Typography.titleMedium, styles.sectionLabel, { color: textSecondary }]}>
          Appearance
        </Text>

        <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
          {themeOptions.map((option, index) => {
            const isSelected = preference === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.option,
                  index < themeOptions.length - 1 && [styles.optionBorder, { borderBottomColor: border }],
                ]}
                onPress={() => setPreference(option.value)}
              >
                <View style={styles.optionLeft}>
                  <MaterialIcons
                    name={option.icon}
                    size={22}
                    color={isSelected ? primary : textSecondary}
                  />
                  <Text style={[Typography.bodyLarge, { color: textColor, marginLeft: Spacing.md }]}>
                    {option.label}
                  </Text>
                </View>
                {isSelected && (
                  <MaterialIcons name="check" size={22} color={primary} />
                )}
              </Pressable>
            );
          })}
        </View>

        {__DEV__ && (
          <>
            <Text style={[Typography.titleMedium, styles.sectionLabel, { color: textSecondary, marginTop: Spacing.xl }]}>
              Developer
            </Text>

            <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
              <View style={styles.option}>
                <View style={styles.optionLeft}>
                  <MaterialIcons name="refresh" size={22} color={textSecondary} />
                  <Text style={[Typography.bodyLarge, { color: textColor, marginLeft: Spacing.md }]}>
                    Show Onboarding
                  </Text>
                </View>
                <Switch
                  value={showOnboarding}
                  onValueChange={handleToggleOnboarding}
                  trackColor={{ true: primary }}
                />
              </View>
            </View>

            <Text style={[Typography.bodySmall, { color: textSecondary, marginTop: Spacing.sm }]}>
              Reload the app after toggling to see the onboarding flow.
            </Text>
          </>
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
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
