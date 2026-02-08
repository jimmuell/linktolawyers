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

import { AvatarPicker } from '@/components/ui/avatar-picker';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Spacing, Typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';
import { type ProfileUpdateFormData, profileUpdateSchema } from '@/lib/validators';
import { useAuthStore } from '@/stores/auth-store';

export default function EditBasicInfoScreen() {
  const background = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar);

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
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleAvatarPick = async (uri: string) => {
    await uploadAvatar(uri);
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
          <Text style={[Typography.headlineLarge, { color: textColor }]}>Basic Info</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <AvatarPicker uri={profile?.avatar_url ?? null} onPick={handleAvatarPick} />

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
    marginTop: Spacing['2xl'],
  },
});
