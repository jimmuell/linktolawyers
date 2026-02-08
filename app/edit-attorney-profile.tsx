import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Spacing, Typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';
import { type AttorneyProfileFormData, attorneyProfileSchema } from '@/lib/validators';
import { useAuthStore } from '@/stores/auth-store';

export default function EditAttorneyProfileScreen() {
  const background = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const attorneyProfile = useAuthStore((s) => s.attorneyProfile);
  const updateAttorneyProfile = useAuthStore((s) => s.updateAttorneyProfile);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<AttorneyProfileFormData>({
    resolver: zodResolver(attorneyProfileSchema),
    defaultValues: {
      barNumber: attorneyProfile?.bar_number ?? '',
      barState: attorneyProfile?.bar_state ?? '',
      practiceAreas: attorneyProfile?.practice_areas ?? [],
      yearsOfExperience: attorneyProfile?.years_of_experience ?? null,
      bio: attorneyProfile?.bio ?? null,
      hourlyRate: attorneyProfile?.hourly_rate ?? null,
    },
  });

  useEffect(() => {
    if (attorneyProfile) {
      reset({
        barNumber: attorneyProfile.bar_number,
        barState: attorneyProfile.bar_state,
        practiceAreas: attorneyProfile.practice_areas,
        yearsOfExperience: attorneyProfile.years_of_experience,
        bio: attorneyProfile.bio,
        hourlyRate: attorneyProfile.hourly_rate,
      });
    }
  }, [attorneyProfile, reset]);

  const onSubmit = async (data: AttorneyProfileFormData) => {
    try {
      await updateAttorneyProfile({
        bar_number: data.barNumber,
        bar_state: data.barState,
        practice_areas: data.practiceAreas,
        years_of_experience: data.yearsOfExperience,
        bio: data.bio,
        hourly_rate: data.hourlyRate,
      });
      Alert.alert('Success', 'Attorney profile updated');
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <MaterialIcons name="close" size={26} color={textColor} />
          </Pressable>
          <Text style={[Typography.headlineLarge, { color: textColor }]}>Attorney Profile</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.fields}>
            <Controller
              control={control}
              name="barNumber"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <TextInput
                  label="Bar Number"
                  placeholder="Enter your bar number"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="barState"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <TextInput
                  label="Bar State"
                  placeholder="e.g. California"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="practiceAreas"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TextInput
                  label="Practice Areas"
                  placeholder="Family Law, Criminal Defense (comma-separated)"
                  onChangeText={(text) => onChange(text.split(',').map((s) => s.trim()).filter(Boolean))}
                  value={value.join(', ')}
                  error={error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="yearsOfExperience"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <TextInput
                  label="Years of Experience"
                  placeholder="e.g. 10"
                  keyboardType="numeric"
                  onChangeText={(text) => onChange(text === '' ? null : parseInt(text, 10) || null)}
                  onBlur={onBlur}
                  value={value?.toString() ?? ''}
                  error={error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="hourlyRate"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <TextInput
                  label="Hourly Rate ($)"
                  placeholder="e.g. 250"
                  keyboardType="numeric"
                  onChangeText={(text) => onChange(text === '' ? null : parseFloat(text) || null)}
                  onBlur={onBlur}
                  value={value?.toString() ?? ''}
                  error={error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="bio"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <TextInput
                  label="Bio"
                  placeholder="Tell clients about your practice..."
                  multiline
                  numberOfLines={4}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value ?? ''}
                  error={error?.message}
                  style={styles.bioInput}
                />
              )}
            />

            <Button
              title="Save Attorney Profile"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={!isDirty}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  fields: {
    gap: Spacing.lg,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
