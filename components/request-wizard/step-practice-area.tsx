import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PracticeAreaPicker } from '@/components/ui/practice-area-picker';
import { Colors } from '@/constants/theme';
import { Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { RequestCreateFormData } from '@/lib/validators';

export function StepPracticeArea() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { control, formState: { errors } } = useFormContext<RequestCreateFormData>();

  return (
    <View style={styles.container}>
      <ThemedText style={styles.heading}>What type of legal help do you need?</ThemedText>
      <Controller
        control={control}
        name="practiceArea"
        render={({ field: { value, onChange } }) => (
          <PracticeAreaPicker value={value} onSelect={onChange} />
        )}
      />
      {errors.practiceArea && (
        <ThemedText style={[styles.error, { color: colors.error }]}>
          {errors.practiceArea.message}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.lg,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
  },
  error: {
    fontSize: 13,
  },
});
