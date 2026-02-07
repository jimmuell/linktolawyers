import { type Theme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import 'react-native-reanimated';

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
  anchor: '(tabs)',
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

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NavigationThemeWrapper>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </NavigationThemeWrapper>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
