import { type Theme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';
import { ThemeProvider, useThemeContext } from '@/contexts/theme-context';

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
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === '(auth)';
    const isRoot = !firstSegment || firstSegment === 'index';

    if (!isAuthenticated && !inAuthGroup && !isRoot) {
      router.replace('/(auth)/splash');
    }
  }, [isInitialized, isAuthenticated, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NavigationThemeWrapper>
            <ProtectedRouteGuard>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
            </ProtectedRouteGuard>
          </NavigationThemeWrapper>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
