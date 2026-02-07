import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = '@linktolawyers/theme-preference';

interface ThemeContextValue {
  preference: ThemePreference;
  effectiveTheme: 'light' | 'dark';
  setPreference: (pref: ThemePreference) => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  effectiveTheme: 'light',
  setPreference: () => {},
  isLoaded: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
      setIsLoaded(true);
    });
  }, []);

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref);
  };

  const value = useMemo<ThemeContextValue>(() => {
    const effectiveTheme: 'light' | 'dark' =
      preference === 'system' ? (systemScheme ?? 'light') : preference;

    return { preference, effectiveTheme, setPreference, isLoaded };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preference, systemScheme, isLoaded]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return ctx;
}
