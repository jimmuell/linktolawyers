import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
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
import { Radii, Spacing, Typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';
import { type LoginFormData, loginSchema } from '@/lib/validators';
import { useAuthStore } from '@/stores/auth-store';

const TEST_ACCOUNTS = {
  client: { email: 'testclient@linktolawyers.dev', password: 'Test1234!', role: 'client', fullName: 'Test Client' },
  attorney: { email: 'testattorney@linktolawyers.dev', password: 'Test1234!', role: 'attorney', fullName: 'Test Attorney' },
} as const;

export default function LoginScreen() {
  const background = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textLink = useThemeColor({}, 'textLink');
  const warningBg = useThemeColor({}, 'warningBackground');
  const warningColor = useThemeColor({}, 'warning');
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [devLoading, setDevLoading] = useState<'client' | 'attorney' | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
      const { user } = useAuthStore.getState();
      if (user) await fetchProfile(user.id);
    } catch (error) {
      Alert.alert('Sign In Failed', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleDevLogin = async (role: 'client' | 'attorney') => {
    const account = TEST_ACCOUNTS[role];
    setDevLoading(role);
    try {
      try {
        await signIn(account.email, account.password);
      } catch {
        await signUp(account.email, account.password, account.fullName, account.role);
        await signIn(account.email, account.password);
      }
      const { user } = useAuthStore.getState();
      if (user) await fetchProfile(user.id);
    } catch (error) {
      Alert.alert(
        'Dev Login Failed',
        error instanceof Error ? error.message : 'An error occurred. Check Supabase config.',
      );
    } finally {
      setDevLoading(null);
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
            <Text style={[Typography.headlineLarge, { color: textColor }]}>Welcome Back</Text>
            <Text style={[Typography.bodyLarge, styles.subtitle, { color: textSecondary }]}>
              Sign in to your account to continue
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

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <TextInput
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  autoComplete="password"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={error?.message}
                />
              )}
            />

            <Pressable
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPassword}
            >
              <Text style={[Typography.labelMedium, { color: textLink }]}>Forgot Password?</Text>
            </Pressable>

            <Button
              title="Sign In"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[Typography.bodyMedium, { color: textSecondary }]}>
              Don&apos;t have an account?{' '}
            </Text>
            <Pressable onPress={() => router.replace('/(auth)/register')}>
              <Text style={[Typography.labelLarge, { color: textLink }]}>Sign Up</Text>
            </Pressable>
          </View>

          {__DEV__ && (
            <View style={[styles.devSection, { backgroundColor: warningBg, borderColor: warningColor }]}>
              <Text style={[Typography.labelMedium, { color: warningColor }]}>
                DEV ONLY — Quick Login
              </Text>
              <View style={styles.devButtons}>
                <Button
                  title="Test Client"
                  variant="outline"
                  size="sm"
                  loading={devLoading === 'client'}
                  disabled={devLoading !== null}
                  onPress={() => handleDevLogin('client')}
                  style={styles.devButton}
                />
                <Button
                  title="Test Attorney"
                  variant="outline"
                  size="sm"
                  loading={devLoading === 'attorney'}
                  disabled={devLoading !== null}
                  onPress={() => handleDevLogin('attorney')}
                  style={styles.devButton}
                />
              </View>
            </View>
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
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing['3xl'],
  },
  devSection: {
    marginTop: Spacing['3xl'],
    padding: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  devButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  devButton: {
    flex: 1,
  },
});
