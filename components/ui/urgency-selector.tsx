import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { RequestUrgency } from '@/types';

const URGENCY_OPTIONS: { label: string; value: RequestUrgency }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

interface UrgencySelectorProps {
  value: RequestUrgency;
  onChange: (value: RequestUrgency) => void;
}

export function UrgencySelector({ value, onChange }: UrgencySelectorProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {URGENCY_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <Pressable
            key={option.value}
            style={[
              styles.segment,
              isSelected && { backgroundColor: colors.primary },
            ]}
            onPress={() => onChange(option.value)}>
            <ThemedText
              style={[
                styles.label,
                { color: isSelected ? colors.primaryForeground : colors.text },
              ]}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
