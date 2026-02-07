import { MaterialIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
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
import { type ForgotPasswordFormData, forgotPasswordSchema } from '@/lib/validators';

export default function ForgotPasswordScreen() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const background = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textLink = useThemeColor({}, 'textLink');
  const success = useThemeColor({}, 'success');

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    setSentTo(data.email);
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
          {sentTo ? (
            <View style={styles.successContainer}>
              <MaterialIcons name="check-circle" size={64} color={success} />
              <Text style={[Typography.headlineMedium, styles.successTitle, { color: textColor }]}>
                Check Your Email
              </Text>
              <Text
                style={[Typography.bodyLarge, styles.successDescription, { color: textSecondary }]}
              >
                We&apos;ve sent a password reset link to {sentTo}
              </Text>
              <Pressable
                onPress={() => router.replace('/(auth)/login')}
                style={styles.backButton}
              >
                <Text style={[Typography.labelLarge, { color: textLink }]}>Back to Sign In</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={[Typography.headlineLarge, { color: textColor }]}>Reset Password</Text>
                <Text style={[Typography.bodyLarge, styles.subtitle, { color: textSecondary }]}>
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </Text>
              </View>

              <View style={styles.form}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <TextInput
                      label="Email"
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      error={error?.message}
                    />
                  )}
                />

                <Button
                  title="Send Reset Link"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                  onPress={handleSubmit(onSubmit)}
                />
              </View>

              <View style={styles.footer}>
                <Pressable onPress={() => router.replace('/(auth)/login')}>
                  <Text style={[Typography.labelLarge, { color: textLink }]}>Back to Sign In</Text>
                </Pressable>
              </View>
            </>
          )}
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
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing['3xl'],
  },
  subtitle: {
    marginTop: Spacing.sm,
  },
  form: {
    gap: Spacing.lg,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing['3xl'],
  },
  successContainer: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  successTitle: {
    textAlign: 'center',
  },
  successDescription: {
    textAlign: 'center',
  },
  backButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
});
