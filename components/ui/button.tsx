import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { Radii, Spacing, Typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

const sizeConfig = {
  sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, ...Typography.labelMedium },
  md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, ...Typography.labelLarge },
  lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl, ...Typography.bodyLarge },
} as const;

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onPress,
  style,
}: ButtonProps) {
  const primary = useThemeColor({}, 'primary');
  const primaryForeground = useThemeColor({}, 'primaryForeground');
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const variantStyles: Record<ButtonVariant, { bg: string; fg: string; borderColor?: string }> = {
    primary: { bg: primary, fg: primaryForeground },
    secondary: { bg: surface, fg: text },
    outline: { bg: 'transparent', fg: primary, borderColor: primary },
  };

  const { bg, fg, borderColor } = variantStyles[variant];
  const { paddingVertical, paddingHorizontal, ...textStyle } = sizeConfig[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.base,
        {
          paddingVertical,
          paddingHorizontal,
          backgroundColor: bg,
          borderColor: borderColor ?? bg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        variant === 'outline' && styles.outlined,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              textStyle,
              { color: fg, fontWeight: '600' },
              (leftIcon != null) && styles.textLeft,
              (rightIcon != null) && styles.textRight,
            ]}
          >
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  outlined: {
    borderWidth: 1,
  },
  textLeft: {
    marginLeft: Spacing.sm,
  },
  textRight: {
    marginRight: Spacing.sm,
  },
});
