import { useThemeContext } from '@/contexts/theme-context';

export function useColorScheme(): 'light' | 'dark' {
  return useThemeContext().effectiveTheme;
}
