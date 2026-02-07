import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  type ViewToken,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { type OnboardingSlide, onboardingSlides } from '@/constants/onboarding';
import { Spacing } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

const ONBOARDING_KEY = '@linktolawyers/onboarding-complete';
const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const background = useThemeColor({}, 'background');
  const primary = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const border = useThemeColor({}, 'border');
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

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={[styles.slide, { width }]}>
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: currentIndex === index ? 1 : 0.5,
          scale: currentIndex === index ? 1 : 0.8,
        }}
        transition={{ type: 'spring', damping: 15 }}
        style={[styles.iconContainer, { backgroundColor: primary }]}
      >
        <Ionicons name={item.icon} size={64} color="#FFFFFF" />
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{
          opacity: currentIndex === index ? 1 : 0,
          translateY: currentIndex === index ? 0 : 20,
        }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
        <Text style={[styles.description, { color: textSecondary }]}>{item.description}</Text>
      </MotiView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background }]}>
      <View style={styles.header}>
        <Pressable onPress={completeOnboarding} hitSlop={8}>
          <Text style={[styles.skipText, { color: textLink }]}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.flatList}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingSlides.map((slide, index) => (
            <MotiView
              key={slide.id}
              animate={{
                width: currentIndex === index ? 24 : 8,
                backgroundColor: currentIndex === index ? primary : border,
              }}
              transition={{ type: 'spring', damping: 15 }}
              style={styles.dot}
            />
          ))}
        </View>

        <Button
          title={isLastSlide ? 'Get Started' : 'Next'}
          onPress={handleNext}
          size="lg"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: '100%',
  },
});
