import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { RequestCreateFormData } from '@/lib/validators';

export function StepDetails() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { control, formState: { errors } } = useFormContext<RequestCreateFormData>();

  return (
    <View style={styles.container}>
      <ThemedText style={styles.heading}>Describe your legal matter</ThemedText>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Title</ThemedText>
        <Controller
          control={control}
          name="title"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: errors.title ? colors.error : colors.inputBorder }]}
              placeholder="Brief summary of your legal need"
              placeholderTextColor={colors.inputPlaceholder}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              maxLength={120}
            />
          )}
        />
        {errors.title && (
          <ThemedText style={[styles.error, { color: colors.error }]}>{errors.title.message}</ThemedText>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Description</ThemedText>
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[styles.textArea, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: errors.description ? colors.error : colors.inputBorder }]}
              placeholder="Provide details about your situation, what you're looking for, and any relevant context..."
              placeholderTextColor={colors.inputPlaceholder}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={5000}
            />
          )}
        />
        {errors.description && (
          <ThemedText style={[styles.error, { color: colors.error }]}>{errors.description.message}</ThemedText>
        )}
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
  input: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    fontSize: 16,
    minHeight: 150,
  },
  error: {
    fontSize: 13,
  },
});
