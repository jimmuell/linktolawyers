import { useEffect, useState } from 'react';

import { useThemeContext } from '@/contexts/theme-context';

/**
 * On web, return 'light' until hydrated to support static rendering,
 * then read from ThemeContext.
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);
  const { effectiveTheme } = useThemeContext();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (hasHydrated) {
    return effectiveTheme;
  }

  return 'light';
}
