import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Spacing, Typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

const ONBOARDING_KEY = '@linktolawyers/onboarding-complete';

export default function SplashScreen() {
  const background = useThemeColor({}, 'background');
  const primary = useThemeColor({}, 'primary');
  const textSecondary = useThemeColor({}, 'textSecondary');

  useEffect(() => {
    const navigate = async () => {
      const [onboardingComplete] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_KEY),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

      if (onboardingComplete) {
        router.replace('/(auth)/login');
      } else {
        router.replace('/(auth)/onboarding');
      }
    };

    navigate();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Animated.View entering={FadeIn.duration(800)} style={styles.content}>
        <Text style={[Typography.headlineLarge, styles.title, { color: primary }]}>
          LinkToLawyers
        </Text>
        <Text style={[Typography.bodyLarge, styles.tagline, { color: textSecondary }]}>
          Connect with the right legal help
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    marginBottom: Spacing.sm,
  },
  tagline: {
    textAlign: 'center',
  },
});
