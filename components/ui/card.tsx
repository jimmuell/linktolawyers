import { StyleSheet, View, type ViewProps } from 'react-native';

import { Elevation, Radii, Spacing } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  lightColor?: string;
  darkColor?: string;
}

export function Card({
  variant = 'default',
  lightColor,
  darkColor,
  style,
  children,
  ...rest
}: CardProps) {
  const cardBg = useThemeColor(
    { light: lightColor, dark: darkColor },
    variant === 'elevated' ? 'cardElevated' : 'card',
  );
  const borderColor = useThemeColor({}, 'border');

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: cardBg },
        variant === 'elevated' && Elevation.md,
        variant === 'outlined' && [styles.outlined, { borderColor }],
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.lg,
    padding: Spacing.lg,
  },
  outlined: {
    borderWidth: 1,
  },
});
