import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';

const STEP_LABELS = ['Area', 'Details', 'Location', 'Budget', 'Attach', 'Review'];

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View key={i} style={styles.dotWrapper}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: i <= currentStep ? colors.primary : colors.border,
                },
              ]}
            />
            <ThemedText
              style={[
                styles.label,
                { color: i <= currentStep ? colors.primary : colors.textTertiary },
              ]}>
              {STEP_LABELS[i]}
            </ThemedText>
          </View>
        ))}
      </View>
      <ThemedText style={[styles.counter, { color: colors.textSecondary }]}>
        {currentStep + 1} of {totalSteps}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  dotWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  dot: {
    height: 4,
    width: '100%',
    borderRadius: Radii.full,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
  counter: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.xxs,
  },
});
