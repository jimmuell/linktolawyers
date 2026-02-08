import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Controller, useFormContext } from 'react-hook-form';
import { FlatList, Modal, Pressable, SafeAreaView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { US_STATES, US_STATE_MAP } from '@/constants/us-states';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { RequestCreateFormData } from '@/lib/validators';
import { useState } from 'react';

export function StepLocation() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { control, formState: { errors } } = useFormContext<RequestCreateFormData>();
  const [showStatePicker, setShowStatePicker] = useState(false);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.heading}>Where do you need legal help?</ThemedText>
      <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
        Optional — helps attorneys find relevant requests.
      </ThemedText>

      <View style={styles.field}>
        <ThemedText style={styles.label}>State</ThemedText>
        <Controller
          control={control}
          name="state"
          render={({ field: { value, onChange } }) => (
            <>
              <Pressable
                style={[styles.selectButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                onPress={() => setShowStatePicker(true)}>
                <ThemedText style={{ color: value ? colors.text : colors.inputPlaceholder }}>
                  {value ? US_STATE_MAP[value] || value : 'Select a state'}
                </ThemedText>
                <MaterialIcons name="expand-more" size={20} color={colors.textTertiary} />
              </Pressable>

              {value && (
                <Pressable onPress={() => onChange(null)}>
                  <ThemedText style={[styles.clearText, { color: colors.textLink }]}>Clear</ThemedText>
                </Pressable>
              )}

              <Modal visible={showStatePicker} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                  <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
                    <ThemedText style={styles.modalTitle}>Select State</ThemedText>
                    <Pressable onPress={() => setShowStatePicker(false)}>
                      <MaterialIcons name="close" size={24} color={colors.text} />
                    </Pressable>
                  </View>
                  <FlatList
                    data={US_STATES}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) => {
                      const isSelected = value === item.value;
                      return (
                        <Pressable
                          style={[styles.modalItem, { borderBottomColor: colors.separator }]}
                          onPress={() => {
                            onChange(item.value);
                            setShowStatePicker(false);
                          }}>
                          <ThemedText style={isSelected ? styles.selectedText : undefined}>
                            {item.label}
                          </ThemedText>
                          {isSelected && <MaterialIcons name="check" size={20} color={colors.primary} />}
                        </Pressable>
                      );
                    }}
                  />
                </SafeAreaView>
              </Modal>
            </>
          )}
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>City</ThemedText>
        <Controller
          control={control}
          name="city"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
              placeholder="e.g. Los Angeles"
              placeholderTextColor={colors.inputPlaceholder}
              value={value ?? ''}
              onChangeText={(text) => onChange(text || null)}
              onBlur={onBlur}
              maxLength={100}
            />
          )}
        />
        {errors.city && (
          <ThemedText style={[styles.error, { color: colors.error }]}>{errors.city.message}</ThemedText>
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
  subtitle: {
    fontSize: 14,
    marginTop: -Spacing.md,
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
  selectButton: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearText: {
    fontSize: 14,
  },
  error: {
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  selectedText: {
    fontWeight: '600',
  },
});
