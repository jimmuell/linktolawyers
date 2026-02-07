import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  type ViewToken,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { type OnboardingSlide, onboardingSlides } from '@/constants/onboarding';
import { Radii, Spacing, Typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

const ONBOARDING_KEY = '@linktolawyers/onboarding-complete';

function PaginationDot({ isActive }: { isActive: boolean }) {
  const primary = useThemeColor({}, 'primary');
  const border = useThemeColor({}, 'border');

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(isActive ? 24 : 8, { duration: 200 }),
    backgroundColor: withTiming(isActive ? primary : border, { duration: 200 }),
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const background = useThemeColor({}, 'background');
  const primary = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surface = useThemeColor({}, 'surface');
  const textLink = useThemeColor({}, 'textLink');

  const isLastSlide = currentIndex === onboardingSlides.length - 1;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<OnboardingSlide>[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(auth)/login');
  }, []);

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      completeOnboarding();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }, [isLastSlide, currentIndex, completeOnboarding]);

  const renderItem = useCallback(
    ({ item }: { item: OnboardingSlide }) => (
      <View style={[styles.slide, { width }]}>
        <View style={[styles.iconContainer, { backgroundColor: surface }]}>
          <MaterialIcons name={item.iconName} size={64} color={primary} />
        </View>
        <Text style={[Typography.headlineMedium, styles.slideTitle, { color: textColor }]}>
          {item.title}
        </Text>
        <Text style={[Typography.bodyLarge, styles.slideDescription, { color: textSecondary }]}>
          {item.description}
        </Text>
      </View>
    ),
    [width, primary, textColor, textSecondary, surface],
  );

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingSlides.map((slide, index) => (
            <PaginationDot key={slide.id} isActive={index === currentIndex} />
          ))}
        </View>

        <View style={styles.actions}>
          {!isLastSlide && (
            <Pressable onPress={completeOnboarding} style={styles.skipButton}>
              <Text style={[Typography.labelLarge, { color: textLink }]}>Skip</Text>
            </Pressable>
          )}
          <Button
            title={isLastSlide ? 'Get Started' : 'Next'}
            onPress={handleNext}
            size="lg"
            style={styles.nextButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: Radii['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  slideTitle: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  slideDescription: {
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['5xl'],
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing['3xl'],
  },
  dot: {
    height: 8,
    borderRadius: Radii.full,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  nextButton: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
});
