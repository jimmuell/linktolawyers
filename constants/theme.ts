import { Platform } from 'react-native';

/** Raw color palette — use Colors for themed values */
export const palette = {
  navy: {
    50: '#EEF2F7',
    100: '#D4DFEB',
    200: '#A9BFDB',
    300: '#7E9FC7',
    400: '#4C7AAF',
    500: '#1B3A5C',
    600: '#163050',
    700: '#112640',
    800: '#0C1C30',
    900: '#071220',
  },
  teal: {
    50: '#E6F4F8',
    100: '#B3DDE9',
    200: '#80C7DA',
    300: '#4DB0CB',
    400: '#2A9ABD',
    500: '#0A7EA4',
    600: '#086B8C',
    700: '#065870',
    800: '#044554',
    900: '#023238',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F5F6F7',
    100: '#ECEDEE',
    200: '#D4D6D8',
    300: '#B0B4B8',
    400: '#9BA1A6',
    500: '#687076',
    600: '#4E5459',
    700: '#33393E',
    800: '#1E2326',
    900: '#151718',
    1000: '#000000',
  },
  success: {
    light: '#16A34A',
    dark: '#4ADE80',
    bgLight: '#F0FDF4',
    bgDark: '#14241A',
  },
  warning: {
    light: '#CA8A04',
    dark: '#FACC15',
    bgLight: '#FEFCE8',
    bgDark: '#27241A',
  },
  error: {
    light: '#DC2626',
    dark: '#F87171',
    bgLight: '#FEF2F2',
    bgDark: '#2A1616',
  },
  info: {
    light: '#2563EB',
    dark: '#60A5FA',
    bgLight: '#EFF6FF',
    bgDark: '#172035',
  },
} as const;

export const Colors = {
  light: {
    // Existing keys (tint updated to navy)
    text: '#11181C',
    background: '#fff',
    tint: palette.navy[500],
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: palette.navy[500],

    // Brand
    primary: palette.navy[500],
    primaryForeground: '#FFFFFF',
    secondary: palette.teal[500],
    secondaryForeground: '#FFFFFF',

    // Surfaces
    surface: palette.neutral[50],
    surfaceSecondary: palette.neutral[100],
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',

    // Borders
    border: palette.neutral[200],
    borderFocused: palette.navy[500],
    separator: palette.neutral[100],

    // Text variants
    textSecondary: palette.neutral[500],
    textTertiary: palette.neutral[400],
    textLink: palette.teal[500],

    // Inputs
    inputBackground: '#FFFFFF',
    inputBorder: palette.neutral[300],
    inputPlaceholder: palette.neutral[400],

    // Status
    success: palette.success.light,
    successBackground: palette.success.bgLight,
    warning: palette.warning.light,
    warningBackground: palette.warning.bgLight,
    error: palette.error.light,
    errorBackground: palette.error.bgLight,
    info: palette.info.light,
    infoBackground: palette.info.bgLight,

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.4)',

    // React Navigation theme keys
    navPrimary: palette.navy[500],
    navBackground: '#FFFFFF',
    navCard: '#FFFFFF',
    navText: '#11181C',
    navBorder: palette.neutral[200],
    navNotification: palette.error.light,
  },
  dark: {
    // Existing keys
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',

    // Brand
    primary: palette.teal[400],
    primaryForeground: '#FFFFFF',
    secondary: palette.navy[300],
    secondaryForeground: '#FFFFFF',

    // Surfaces
    surface: palette.neutral[800],
    surfaceSecondary: palette.neutral[700],
    card: palette.neutral[800],
    cardElevated: palette.neutral[700],

    // Borders
    border: palette.neutral[600],
    borderFocused: palette.teal[400],
    separator: palette.neutral[700],

    // Text variants
    textSecondary: palette.neutral[400],
    textTertiary: palette.neutral[500],
    textLink: palette.teal[300],

    // Inputs
    inputBackground: palette.neutral[800],
    inputBorder: palette.neutral[600],
    inputPlaceholder: palette.neutral[500],

    // Status
    success: palette.success.dark,
    successBackground: palette.success.bgDark,
    warning: palette.warning.dark,
    warningBackground: palette.warning.bgDark,
    error: palette.error.dark,
    errorBackground: palette.error.bgDark,
    info: palette.info.dark,
    infoBackground: palette.info.bgDark,

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.6)',

    // React Navigation theme keys
    navPrimary: palette.teal[400],
    navBackground: '#151718',
    navCard: palette.neutral[800],
    navText: '#ECEDEE',
    navBorder: palette.neutral[600],
    navNotification: palette.error.dark,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
