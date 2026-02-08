import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { UrgencySelector } from '@/components/ui/urgency-selector';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { RequestCreateFormData } from '@/lib/validators';

export function StepBudget() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { control, formState: { errors } } = useFormContext<RequestCreateFormData>();

  return (
    <View style={styles.container}>
      <ThemedText style={styles.heading}>Budget & Urgency</ThemedText>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Budget Range (optional)</ThemedText>
        <View style={styles.budgetRow}>
          <Controller
            control={control}
            name="budgetMin"
            render={({ field: { value, onChange, onBlur } }) => (
              <View style={styles.budgetField}>
                <ThemedText style={[styles.prefix, { color: colors.textSecondary }]}>$</ThemedText>
                <TextInput
                  style={[styles.budgetInput, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: errors.budgetMin ? colors.error : colors.inputBorder }]}
                  placeholder="Min"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={value != null ? String(value) : ''}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    onChange(isNaN(num) ? null : num);
                  }}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                />
              </View>
            )}
          />
          <ThemedText style={[styles.dash, { color: colors.textTertiary }]}>—</ThemedText>
          <Controller
            control={control}
            name="budgetMax"
            render={({ field: { value, onChange, onBlur } }) => (
              <View style={styles.budgetField}>
                <ThemedText style={[styles.prefix, { color: colors.textSecondary }]}>$</ThemedText>
                <TextInput
                  style={[styles.budgetInput, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: errors.budgetMax ? colors.error : colors.inputBorder }]}
                  placeholder="Max"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={value != null ? String(value) : ''}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    onChange(isNaN(num) ? null : num);
                  }}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                />
              </View>
            )}
          />
        </View>
        {errors.budgetMax && (
          <ThemedText style={[styles.error, { color: colors.error }]}>{errors.budgetMax.message}</ThemedText>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>How urgent is this?</ThemedText>
        <Controller
          control={control}
          name="urgency"
          render={({ field: { value, onChange } }) => (
            <UrgencySelector value={value} onChange={onChange} />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xl,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  budgetField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefix: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  budgetInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: 16,
  },
  dash: {
    fontSize: 18,
  },
  error: {
    fontSize: 13,
  },
});
