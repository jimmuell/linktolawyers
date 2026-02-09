import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TypingIndicatorProps {
  name: string;
}

function AnimatedDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);

  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: colors.textTertiary, opacity }]}
    />
  );
}

export function TypingIndicator({ name }: TypingIndicatorProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.text, { color: colors.textTertiary }]}>
        {name} is typing
      </ThemedText>
      <View style={styles.dots}>
        <AnimatedDot delay={0} />
        <AnimatedDot delay={200} />
        <AnimatedDot delay={400} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  text: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
