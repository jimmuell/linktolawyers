import { zodResolver } from '@hookform/resolvers/zod';
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

import { MaterialIcons } from '@expo/vector-icons';

import { AvatarPicker } from '@/components/ui/avatar-picker';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Spacing, Typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  type AttorneyProfileFormData,
  type ProfileUpdateFormData,
  attorneyProfileSchema,
  profileUpdateSchema,
} from '@/lib/validators';
import { useAuthStore } from '@/stores/auth-store';

function BaseProfileForm() {
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar);

  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      username: profile?.username ?? null,
      fullName: profile?.full_name ?? null,
      website: profile?.website ?? '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        username: profile.username ?? null,
        fullName: profile.full_name ?? null,
        website: profile.website ?? '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileUpdateFormData) => {
    try {
      await updateProfile({
        username: data.username,
        full_name: data.fullName,
        website: data.website || null,
      });
      Alert.alert('Success', 'Profile updated');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleAvatarPick = async (uri: string) => {
    await uploadAvatar(uri);
  };

  return (
    <View style={styles.section}>
      <AvatarPicker uri={profile?.avatar_url ?? null} onPick={handleAvatarPick} />

      <Text style={[Typography.titleMedium, styles.sectionTitle, { color: textColor }]}>
        Personal Info
      </Text>
      <Text style={[Typography.bodySmall, styles.sectionSubtitle, { color: textSecondary }]}>
        {profile?.role === 'attorney' ? 'Attorney' : 'Client'} Account
      </Text>

      <View style={styles.fields}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <TextInput
              label="Full Name"
              placeholder="Your full name"
              autoComplete="name"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value ?? ''}
              error={error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <TextInput
              label="Username"
              placeholder="Choose a username"
              autoCapitalize="none"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value ?? ''}
              error={error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="website"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <TextInput
              label="Website"
              placeholder="https://example.com"
              keyboardType="url"
              autoCapitalize="none"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value ?? ''}
              error={error?.message}
            />
          )}
        />

        <Button
          title="Save Profile"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={!isDirty}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </View>
  );
}

function AttorneyProfileForm() {
  const attorneyProfile = useAuthStore((s) => s.attorneyProfile);
  const updateAttorneyProfile = useAuthStore((s) => s.updateAttorneyProfile);

  const textColor = useThemeColor({}, 'text');

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
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update');
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[Typography.titleMedium, styles.sectionTitle, { color: textColor }]}>
        Attorney Details
      </Text>

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
          title="Save Attorney Details"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={!isDirty}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const background = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to sign out');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[Typography.headlineLarge, { color: textColor }]}>Profile</Text>
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={8}
            >
              <MaterialIcons name="settings" size={26} color={textColor} />
            </Pressable>
          </View>

          <BaseProfileForm />

          {profile?.role === 'attorney' && <AttorneyProfileForm />}

          <View style={styles.signOutSection}>
            <Button title="Sign Out" variant="outline" onPress={handleSignOut} />
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
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  section: {
    marginBottom: Spacing['3xl'],
  },
  sectionTitle: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxs,
  },
  sectionSubtitle: {
    marginBottom: Spacing.lg,
  },
  fields: {
    gap: Spacing.lg,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  signOutSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing['3xl'],
  },
});
