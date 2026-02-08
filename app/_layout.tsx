import { type Theme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';
import { ThemeProvider, useThemeContext } from '@/contexts/theme-context';
import { getRoleHomePath } from '@/lib/role-routes';
import { useAuthStore } from '@/stores/auth-store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    },
  },
});

export const unstable_settings = {
  initialRouteName: 'index',
};

function NavigationThemeWrapper({ children }: { children: React.ReactNode }) {
  const { effectiveTheme } = useThemeContext();
  const colors = Colors[effectiveTheme];

  const navTheme = useMemo<Theme>(
    () => ({
      dark: effectiveTheme === 'dark',
      colors: {
        primary: colors.navPrimary,
        background: colors.navBackground,
        card: colors.navCard,
        text: colors.navText,
        border: colors.navBorder,
        notification: colors.navNotification,
      },
      fonts: {
        regular: { fontFamily: 'System', fontWeight: '400' },
        medium: { fontFamily: 'System', fontWeight: '500' },
        bold: { fontFamily: 'System', fontWeight: '700' },
        heavy: { fontFamily: 'System', fontWeight: '800' },
      },
    }),
    [effectiveTheme, colors],
  );

  return (
    <NavigationThemeProvider value={navTheme}>
      {children}
      <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

function ProtectedRouteGuard({ children }: { children: React.ReactNode }) {
  const { isInitialized, isAuthenticated } = useAuth();
  const profile = useAuthStore((s) => s.profile);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === '(auth)';
    const isRoot = !firstSegment || firstSegment === 'index';
    const inProtectedGroup =
      firstSegment === '(client)' || firstSegment === '(attorney)';

    if (!isAuthenticated && inProtectedGroup) {
      router.replace('/(auth)/splash');
    } else if (isAuthenticated && profile && (inAuthGroup || isRoot)) {
      router.replace(getRoleHomePath(profile.role));
    }
  }, [isInitialized, isAuthenticated, profile, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <NavigationThemeWrapper>
              <ProtectedRouteGuard>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(client)" options={{ headerShown: false }} />
                  <Stack.Screen name="(attorney)" options={{ headerShown: false }} />
                  <Stack.Screen name="profile" options={{ presentation: 'modal', headerShown: false }} />
                  <Stack.Screen name="edit-basic-info" options={{ presentation: 'modal', headerShown: false }} />
                  <Stack.Screen name="edit-attorney-profile" options={{ presentation: 'modal', headerShown: false }} />
                  <Stack.Screen name="availability" options={{ presentation: 'modal', headerShown: false }} />
                  <Stack.Screen name="notifications" options={{ presentation: 'modal', headerShown: false }} />
                  <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                </Stack>
              </ProtectedRouteGuard>
            </NavigationThemeWrapper>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
